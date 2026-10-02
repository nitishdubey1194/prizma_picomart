import { db } from "@/lib/db";
import {
  providerAvailability,
  providerAvailabilityExceptions,
  providers,
} from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, asc } from "drizzle-orm";

export interface RecurringBlockInput {
  weekday: number; // 0 (Sun) to 6 (Sat)
  startTime: string; // HH:MM or HH:MM:SS
  endTime: string;   // HH:MM or HH:MM:SS
  isActive?: boolean;
}

export interface DateExceptionInput {
  exceptionDate: string; // YYYY-MM-DD
  isAvailable: boolean;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface ProviderAvailabilityRecord {
  id: number;
  tenantId: number;
  providerId: number;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean | null;
}

export interface ProviderExceptionRecord {
  id: number;
  tenantId: number;
  providerId: number;
  exceptionDate: string;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface DeleteOperationResult {
  success: true;
}

/**
 * Normalizes input ID into number matching Drizzle's PgBigInt53 (mode: "number")
 */
function toNumericId(value: number | bigint | string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new AppError(400, `Invalid numeric ID: ${String(value)}`);
  }
  return parsed;
}

/**
 * Lists the recurring weekly availability schedule for a provider.
 */
export async function getProviderWeeklySchedule(
  tenantId: number | bigint | string,
  providerId: number | bigint | string
): Promise<ProviderAvailabilityRecord[]> {
  const pTenantId = toNumericId(tenantId);
  const pProviderId = toNumericId(providerId);

  const rows = await db
    .select({
      id: providerAvailability.id,
      tenantId: providerAvailability.tenantId,
      providerId: providerAvailability.providerId,
      weekday: providerAvailability.weekday,
      startTime: providerAvailability.startTime,
      endTime: providerAvailability.endTime,
      isActive: providerAvailability.isActive,
    })
    .from(providerAvailability)
    .where(
      and(
        eq(providerAvailability.tenantId, pTenantId),
        eq(providerAvailability.providerId, pProviderId)
      )
    )
    .orderBy(asc(providerAvailability.weekday), asc(providerAvailability.startTime));

  return rows;
}

/**
 * Creates or appends a weekly recurring availability block.
 */
export async function addRecurringBlock(
  tenantId: number | bigint | string,
  userId: string,
  providerId: number | bigint | string,
  input: RecurringBlockInput
): Promise<ProviderAvailabilityRecord> {
  const pTenantId = toNumericId(tenantId);
  const pProviderId = toNumericId(providerId);

  if (!Number.isInteger(input.weekday) || input.weekday < 0 || input.weekday > 6) {
    throw new AppError(400, "Weekday must be an integer between 0 (Sunday) and 6 (Saturday).");
  }

  if (input.startTime >= input.endTime) {
    throw new AppError(400, "Start time must precede end time.");
  }

  return await withTenantContext(pTenantId, userId, async (tx): Promise<ProviderAvailabilityRecord> => {
    // 1. Verify provider belongs to this tenant[cite: 1]
    const [provider] = await tx
      .select({ id: providers.id })
      .from(providers)
      .where(
        and(
          eq(providers.id, pProviderId),
          eq(providers.tenantId, pTenantId)
        )
      )
      .limit(1);

    if (!provider) {
      throw new AppError(404, "Provider not found.");
    }

    // 2. Insert availability block[cite: 1]
    const [created] = await tx
      .insert(providerAvailability)
      .values({
        tenantId: pTenantId,
        providerId: pProviderId,
        weekday: input.weekday,
        startTime: input.startTime,
        endTime: input.endTime,
        isActive: input.isActive ?? true,
      })
      .returning();

    if (!created) {
      throw new AppError(500, "Failed to create recurring availability block.");
    }

    return created;
  });
}

/**
 * Deletes a weekly recurring availability block.
 */
export async function deleteRecurringBlock(
  tenantId: number | bigint | string,
  userId: string,
  providerId: number | bigint | string,
  blockId: number | bigint | string
): Promise<DeleteOperationResult> {
  const pTenantId = toNumericId(tenantId);
  const pProviderId = toNumericId(providerId);
  const pBlockId = toNumericId(blockId);

  return await withTenantContext(pTenantId, userId, async (tx): Promise<DeleteOperationResult> => {
    const deleted = await tx
      .delete(providerAvailability)
      .where(
        and(
          eq(providerAvailability.id, pBlockId),
          eq(providerAvailability.tenantId, pTenantId),
          eq(providerAvailability.providerId, pProviderId)
        )
      )
      .returning({ id: providerAvailability.id });

    if (deleted.length === 0) {
      throw new AppError(404, "Availability block not found.");
    }

    return { success: true };
  });
}

/**
 * Lists date-specific exceptions for a provider.
 */
export async function getProviderExceptions(
  tenantId: number | bigint | string,
  providerId: number | bigint | string
): Promise<ProviderExceptionRecord[]> {
  const pTenantId = toNumericId(tenantId);
  const pProviderId = toNumericId(providerId);

  const rows = await db
    .select({
      id: providerAvailabilityExceptions.id,
      tenantId: providerAvailabilityExceptions.tenantId,
      providerId: providerAvailabilityExceptions.providerId,
      exceptionDate: providerAvailabilityExceptions.exceptionDate,
      isAvailable: providerAvailabilityExceptions.isAvailable,
      startTime: providerAvailabilityExceptions.startTime,
      endTime: providerAvailabilityExceptions.endTime,
      reason: providerAvailabilityExceptions.reason,
    })
    .from(providerAvailabilityExceptions)
    .where(
      and(
        eq(providerAvailabilityExceptions.tenantId, pTenantId),
        eq(providerAvailabilityExceptions.providerId, pProviderId)
      )
    )
    .orderBy(asc(providerAvailabilityExceptions.exceptionDate));

  return rows;
}

/**
 * Creates or updates an availability exception for a specific calendar date.
 */
export async function addDateException(
  tenantId: number | bigint | string,
  userId: string,
  providerId: number | bigint | string,
  input: DateExceptionInput
): Promise<ProviderExceptionRecord> {
  const pTenantId = toNumericId(tenantId);
  const pProviderId = toNumericId(providerId);

  if (input.isAvailable && (!input.startTime || !input.endTime)) {
    throw new AppError(400, "Start and end times are required when marking a date as available.");
  }

  if (input.startTime && input.endTime && input.startTime >= input.endTime) {
    throw new AppError(400, "Start time must precede end time.");
  }

  return await withTenantContext(pTenantId, userId, async (tx): Promise<ProviderExceptionRecord> => {
    // 1. Verify provider belongs to tenant[cite: 1]
    const [provider] = await tx
      .select({ id: providers.id })
      .from(providers)
      .where(
        and(
          eq(providers.id, pProviderId),
          eq(providers.tenantId, pTenantId)
        )
      )
      .limit(1);

    if (!provider) {
      throw new AppError(404, "Provider not found.");
    }

    // 2. Insert exception record[cite: 1]
    const [created] = await tx
      .insert(providerAvailabilityExceptions)
      .values({
        tenantId: pTenantId,
        providerId: pProviderId,
        exceptionDate: input.exceptionDate,
        isAvailable: input.isAvailable,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        reason: input.reason?.trim() || null,
      })
      .returning();

    if (!created) {
      throw new AppError(500, "Failed to record availability exception.");
    }

    return created;
  });
}

/**
 * Deletes a date-specific availability exception.
 */
export async function deleteDateException(
  tenantId: number | bigint | string,
  userId: string,
  providerId: number | bigint | string,
  exceptionId: number | bigint | string
): Promise<DeleteOperationResult> {
  const pTenantId = toNumericId(tenantId);
  const pProviderId = toNumericId(providerId);
  const pExceptionId = toNumericId(exceptionId);

  return await withTenantContext(pTenantId, userId, async (tx): Promise<DeleteOperationResult> => {
    const deleted = await tx
      .delete(providerAvailabilityExceptions)
      .where(
        and(
          eq(providerAvailabilityExceptions.id, pExceptionId),
          eq(providerAvailabilityExceptions.tenantId, pTenantId),
          eq(providerAvailabilityExceptions.providerId, pProviderId)
        )
      )
      .returning({ id: providerAvailabilityExceptions.id });

    if (deleted.length === 0) {
      throw new AppError(404, "Availability exception not found.");
    }

    return { success: true };
  });
}

/**
 * Route handler compatibility alias
 */
export const removeProviderException = deleteDateException;
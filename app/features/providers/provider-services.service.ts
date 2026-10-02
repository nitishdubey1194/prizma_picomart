import { db } from "@/lib/db";
import { providerServices, services, providers } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, sql } from "drizzle-orm";

export interface AssignServiceWithOverridesInput {
  serviceId: number;
  priceOverride?: string | null;
  durationOverrideMinutes?: number | null;
  isActive?: boolean;
}

export interface AssignServiceToProviderInput {
  serviceId: number | bigint | string;
  priceOverride?: string | number | null;
  durationOverrideMinutes?: number | null;
  isActive?: boolean;
}

export interface UpdateProviderServiceInput {
  priceOverride?: string | number | null;
  durationOverrideMinutes?: number | null;
  isActive?: boolean;
}

/**
 * Lists all services mapped to a provider with their base rates and overrides.
 */
export async function getProviderServices(
  tenantId: number | bigint,
  providerId: number | bigint
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(providerId);

  return await db
    .select({
      id: providerServices.id,
      tenantId: providerServices.tenantId,
      providerId: providerServices.providerId,
      serviceId: providerServices.serviceId,
      priceOverride: providerServices.priceOverride,
      durationOverrideMinutes: providerServices.durationOverrideMinutes,
      isActive: providerServices.isActive,
      service: {
        id: services.id,
        name: services.name,
        slug: services.slug,
        basePrice: services.price,
        baseDurationMinutes: services.durationMinutes,
        bufferMinutes: services.bufferMinutes,
        isActive: services.isActive,
      },
    })
    .from(providerServices)
    .innerJoin(services, eq(services.id, providerServices.serviceId))
    .where(
      and(
        eq(providerServices.tenantId, pTenantId),
        eq(providerServices.providerId, pProviderId),
        eq(providerServices.isActive, true)
      )
    );
}

/**
 * Maps a catalog service to a provider with optional price or duration overrides.
 */
export async function assignServiceToProvider(
  tenantId: number | bigint,
  userId: string,
  providerId: number | bigint,
  input: AssignServiceToProviderInput
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(providerId);
  const pServiceId = Number(input.serviceId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
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

    // 2. Verify service exists for this tenant[cite: 1]
    const [service] = await tx
      .select({ id: services.id })
      .from(services)
      .where(
        and(
          eq(services.id, pServiceId),
          eq(services.tenantId, pTenantId)
        )
      )
      .limit(1);

    if (!service) {
      throw new AppError(404, "Service not found.");
    }

    // 3. Check for existing mapping[cite: 1]
    const [existing] = await tx
      .select({ id: providerServices.id })
      .from(providerServices)
      .where(
        and(
          eq(providerServices.tenantId, pTenantId),
          eq(providerServices.providerId, pProviderId),
          eq(providerServices.serviceId, pServiceId)
        )
      )
      .limit(1);

    if (existing) {
      throw new AppError(409, "Service is already assigned to this provider.");
    }

    // 4. Insert mapping[cite: 1]
    const [mapping] = await tx
      .insert(providerServices)
      .values({
        tenantId: pTenantId,
        providerId: pProviderId,
        serviceId: pServiceId,
        priceOverride:
          input.priceOverride != null ? String(input.priceOverride) : null,
        durationOverrideMinutes: input.durationOverrideMinutes ?? null,
        isActive: input.isActive ?? true,
      })
      .returning();

    return mapping;
  });
}

/**
 * Updates pricing or duration overrides on an assigned service.
 */
export async function updateProviderService(
  tenantId: number | bigint,
  userId: string,
  providerId: number | bigint,
  serviceId: number | bigint,
  input: UpdateProviderServiceInput
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(providerId);
  const pServiceId = Number(serviceId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const updatePayload: Record<string, unknown> = {};

    if (input.priceOverride !== undefined) {
      updatePayload.priceOverride =
        input.priceOverride != null ? String(input.priceOverride) : null;
    }

    if (input.durationOverrideMinutes !== undefined) {
      updatePayload.durationOverrideMinutes = input.durationOverrideMinutes;
    }

    if (input.isActive !== undefined) {
      updatePayload.isActive = input.isActive;
    }

    const [updated] = await tx
      .update(providerServices)
      .set(updatePayload)
      .where(
        and(
          eq(providerServices.tenantId, pTenantId),
          eq(providerServices.providerId, pProviderId),
          eq(providerServices.serviceId, pServiceId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Provider service mapping not found.");
    }

    return updated;
  });
}

/**
 * Unlinks a service from a provider.
 */
export async function removeServiceFromProvider(
  tenantId: number | bigint,
  userId: string,
  providerId: number | bigint,
  serviceId: number | bigint
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(providerId);
  const pServiceId = Number(serviceId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const deleted = await tx
      .delete(providerServices)
      .where(
        and(
          eq(providerServices.tenantId, pTenantId),
          eq(providerServices.providerId, pProviderId),
          eq(providerServices.serviceId, pServiceId)
        )
      )
      .returning({ id: providerServices.id });

    if (!deleted.length) {
      throw new AppError(404, "Provider service mapping not found.");
    }

    return { success: true };
  });
}

export async function upsertProviderService(
  tenantId: number | bigint,
  userId: string,
  providerId: number | bigint,
  input: AssignServiceWithOverridesInput
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(providerId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const [existing] = await tx
      .select({ id: providerServices.id })
      .from(providerServices)
      .where(
        and(
          eq(providerServices.tenantId, pTenantId),
          eq(providerServices.providerId, pProviderId),
          eq(providerServices.serviceId, input.serviceId)
        )
      )
      .limit(1);

    if (existing) {
      const [updated] = await tx
        .update(providerServices)
        .set({
          priceOverride: input.priceOverride ?? null,
          durationOverrideMinutes: input.durationOverrideMinutes ?? null,
          isActive: input.isActive ?? true,
        })
        .where(eq(providerServices.id, existing.id))
        .returning();
      return updated;
    }

    const [inserted] = await tx
      .insert(providerServices)
      .values({
        tenantId: pTenantId,
        providerId: pProviderId,
        serviceId: input.serviceId,
        priceOverride: input.priceOverride ?? null,
        durationOverrideMinutes: input.durationOverrideMinutes ?? null,
        isActive: input.isActive ?? true,
      })
      .returning();

    return inserted;
  });
}
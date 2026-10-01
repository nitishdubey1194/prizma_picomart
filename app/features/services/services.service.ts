import { db } from "@/lib/db";
import { services } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, sql, asc } from "drizzle-orm";

export interface CreateServiceInput {
  name: string;
  slug: string;
  description?: string | null;
  durationMinutes: number;
  price: string | number;
  bufferMinutes?: number;
  isActive?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  slug?: string;
  description?: string | null;
  durationMinutes?: number;
  price?: string | number;
  bufferMinutes?: number;
  isActive?: boolean;
}

/**
 * Lists all active services for a tenant.
 */
export async function getTenantServices(tenantId: number | bigint) {
  const pTenantId = Number(tenantId);

  return await db
    .select({
      id: services.id,
      tenantId: services.tenantId,
      name: services.name,
      slug: services.slug,
      description: services.description,
      durationMinutes: services.durationMinutes,
      price: services.price,
      bufferMinutes: services.bufferMinutes,
      isActive: services.isActive,
      createdAt: services.createdAt,
      updatedAt: services.updatedAt,
    })
    .from(services)
    .where(
      and(
        eq(services.tenantId, pTenantId),
        eq(services.isActive, true)
      )
    )
    .orderBy(asc(services.name));
}

/**
 * Fetches a single service by ID.
 */
export async function getServiceById(
  tenantId: number | bigint,
  serviceId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pServiceId = Number(serviceId);

  const [service] = await db
    .select()
    .from(services)
    .where(
      and(
        eq(services.id, pServiceId),
        eq(services.tenantId, pTenantId),
        eq(services.isActive, true)
      )
    )
    .limit(1);

  return service ?? null;
}

/**
 * Creates a new base service under the tenant context.
 */
export async function createService(
  tenantId: number | bigint,
  userId: string,
  input: CreateServiceInput
) {
  const pTenantId = Number(tenantId);

  if (input.durationMinutes <= 0) {
    throw new AppError(400, "Service duration must be greater than 0 minutes.");
  }

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // 1. Verify slug uniqueness and retrieve existing fallback values
    const [existingSlug] = await tx
      .select({
        id: services.id,
        bufferMinutes: services.bufferMinutes,
        description: services.description,
      })
      .from(services)
      .where(
        and(
          eq(services.tenantId, pTenantId),
          eq(services.slug, input.slug)
        )
      )
      .limit(1);

    if (existingSlug) {
      const [reactivated] = await tx
        .update(services)
        .set({
          name: input.name,
          durationMinutes: input.durationMinutes,
          price: String(input.price),
          bufferMinutes: input.bufferMinutes ?? existingSlug.bufferMinutes ?? 0,
          description: input.description !== undefined ? input.description : existingSlug.description,
          isActive: true, // Re-enables the service if it was previously soft-deleted/disabled
          updatedAt: sql`now()`,
        })
        .where(eq(services.id, existingSlug.id))
        .returning();

      return reactivated;
    }

    // 2. Insert new service
    const [newService] = await tx
      .insert(services)
      .values({
        tenantId: pTenantId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        durationMinutes: input.durationMinutes,
        price: String(input.price),
        bufferMinutes: input.bufferMinutes ?? 0,
        isActive: input.isActive ?? true,
      })
      .returning();

    return newService;
  });
}

/**
 * Updates an existing base service.
 */
export async function updateService(
  tenantId: number | bigint,
  userId: string,
  serviceId: number | bigint | string,
  input: UpdateServiceInput
) {
  const pTenantId = Number(tenantId);
  const pServiceId = Number(serviceId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    if (input.durationMinutes !== undefined && input.durationMinutes <= 0) {
      throw new AppError(400, "Service duration must be greater than 0 minutes.");
    }

    // Check slug collision[cite: 1]
    if (input.slug) {
      const [existingSlug] = await tx
        .select({ id: services.id })
        .from(services)
        .where(
          and(
            eq(services.tenantId, pTenantId),
            eq(services.slug, input.slug),
            sql`${services.id} != ${pServiceId}`
          )
        )
        .limit(1);

      if (existingSlug) {
        throw new AppError(409, "A service with this slug already exists.");
      }
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.slug !== undefined) updatePayload.slug = input.slug;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.durationMinutes !== undefined) updatePayload.durationMinutes = input.durationMinutes;
    if (input.price !== undefined) updatePayload.price = String(input.price);
    if (input.bufferMinutes !== undefined) updatePayload.bufferMinutes = input.bufferMinutes;
    if (input.isActive !== undefined) updatePayload.isActive = input.isActive;

    const [updated] = await tx
      .update(services)
      .set(updatePayload)
      .where(
        and(
          eq(services.id, pServiceId),
          eq(services.tenantId, pTenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Service not found.");
    }

    return updated;
  });
}

/**
 * Soft deletes a service by disabling its active flag.
 */
export async function deleteService(
  tenantId: number | bigint,
  userId: string,
  serviceId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pServiceId = Number(serviceId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const [deleted] = await tx
      .update(services)
      .set({
        isActive: false,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(services.id, pServiceId),
          eq(services.tenantId, pTenantId)
        )
      )
      .returning({ id: services.id });

    if (!deleted) {
      throw new AppError(404, "Service not found.");
    }

    return { success: true };
  });
}
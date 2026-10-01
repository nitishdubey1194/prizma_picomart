import { db } from "@/lib/db";
import { providers, providerServices, services, users } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, sql, asc } from "drizzle-orm";



export interface ProviderListItem {
  id: number;
  name: string;
  avatarUrl?: string | null;
  isActive: boolean | null;
}

export interface CreateProviderInput {
  name: string;
  slug: string;
  category: string;
  title?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  userId?: string | null;
  isActive?: boolean;
}

export interface UpdateProviderInput {
  name?: string;
  slug?: string;
  category?: string;
  title?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface LinkUserToProviderInput {
  userId: string;
}

export async function getProvidersByService(
  tenantId: number | bigint,
  serviceId?: number | bigint | null
): Promise<ProviderListItem[]> {
  const pTenantId = Number(tenantId);

  if (!serviceId) {
    const rows = await db
      .select({
        id: providers.id,
        name: providers.name,
        title: providers.title,
        avatarUrl: providers.avatarUrl,
        isActive: providers.isActive,
        userId: providers.userId,
      })
      .from(providers)
      .where(
        and(
          eq(providers.tenantId, pTenantId),
          eq(providers.isActive, true)
        )
      );

    return rows.map((r) => ({
      ...r,
      id: Number(r.id),
      isActive: r.isActive ?? false,
    }));
  }

  const pServiceId = Number(serviceId);

  // Join providerServices and services to pull base price and custom override
  const rows = await db
    .select({
      id: providers.id,
      name: providers.name,
      title: providers.title,
      avatarUrl: providers.avatarUrl,
      isActive: providers.isActive,
      basePrice: services.price,
      priceOverride: providerServices.priceOverride,
      baseDurationMinutes: services.durationMinutes,
      durationOverrideMinutes: providerServices.durationOverrideMinutes,
      effectivePrice: sql<string>`COALESCE(${providerServices.priceOverride}, ${services.price})`.as("effective_price"),
      effectiveDuration: sql<number>`COALESCE(${providerServices.durationOverrideMinutes}, ${services.durationMinutes})`.as("effective_duration"),
    })
    .from(providers)
    .innerJoin(
      providerServices,
      eq(providerServices.providerId, providers.id)
    )
    .innerJoin(
      services,
      eq(services.id, providerServices.serviceId)
    )
    .where(
      and(
        eq(providers.tenantId, pTenantId),
        eq(providerServices.serviceId, pServiceId),
        eq(providerServices.isActive, true),
        eq(providers.isActive, true)
      )
    );

  return rows.map((r) => ({
    ...r,
    id: Number(r.id),
    isActive: r.isActive ?? false,
  }));
}

/**
 * Lists all active providers for the tenant with their linked services.
 */
export async function getTenantProviders(tenantId: number | bigint) {
  const pTenantId = Number(tenantId);

  const rows = await db
    .select({
      id: providers.id,
      tenantId: providers.tenantId,
      userId: providers.userId,
      name: providers.name,
      slug: providers.slug,
      category: providers.category,
      title: providers.title,
      bio: providers.bio,
      avatarUrl: providers.avatarUrl,
      isActive: providers.isActive,
      createdAt: providers.createdAt,
      updatedAt: providers.updatedAt,
      userLinkEmail: users.email,
    })
    .from(providers)
    .leftJoin(users, eq(providers.userId, users.id))
    .where(
      and(
        eq(providers.tenantId, pTenantId),
        // eq(providers.isActive, true)
      )
    )
    .orderBy(asc(providers.name));

  return rows;
}

/**
 * Fetches a single provider by ID along with their linked services and pricing overrides.
 */
export async function getProviderById(
  tenantId: number | bigint,
  providerId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(providerId);

  const [provider] = await db
    .select()
    .from(providers)
    .where(
      and(
        eq(providers.id, pProviderId),
        eq(providers.tenantId, pTenantId),
        eq(providers.isActive, true)
      )
    )
    .limit(1);

  if (!provider) {
    return null;
  }

  const linkedServices = await db
    .select({
      providerServiceId: providerServices.id,
      serviceId: providerServices.serviceId,
      name: services.name,
      slug: services.slug,
      basePrice: services.price,
      priceOverride: providerServices.priceOverride,
      baseDurationMinutes: services.durationMinutes,
      durationOverrideMinutes: providerServices.durationOverrideMinutes,
      bufferMinutes: services.bufferMinutes,
      isActive: providerServices.isActive,
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

  return {
    ...provider,
    services: linkedServices,
  };
}

/**
 * Creates a provider within the tenant context.
 */
export async function createProvider(
  tenantId: number | bigint,
  userId: string,
  input: CreateProviderInput
) {
  const pTenantId = Number(tenantId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // 1. Verify slug uniqueness for this tenant[cite: 1]
    const [existingSlug] = await tx
      .select({ id: providers.id })
      .from(providers)
      .where(
        and(
          eq(providers.tenantId, pTenantId),
          eq(providers.slug, input.slug)
        )
      )
      .limit(1);

    if (existingSlug) {
      throw new AppError(409, "A provider with this slug already exists.");
    }

    // 2. Validate linked user if specified[cite: 1]
    if (input.userId) {
      const [existingUser] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!existingUser) {
        throw new AppError(404, "User account to link not found.");
      }
    }

    // 3. Insert provider record[cite: 1]
    const [newProvider] = await tx
      .insert(providers)
      .values({
        tenantId: pTenantId,
        userId: input.userId ?? null,
        name: input.name,
        slug: input.slug,
        category: input.category,
        title: input.title ?? null,
        bio: input.bio ?? null,
        avatarUrl: input.avatarUrl ?? null,
        isActive: input.isActive ?? true,
      })
      .returning();

    return newProvider;
  });
}

/**
 * Updates provider attributes.
 */
export async function updateProvider(
  tenantId: number | bigint,
  userId: string,
  providerId: number | bigint | string,
  input: UpdateProviderInput
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(providerId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    if (input.slug) {
      const [existingSlug] = await tx
        .select({ id: providers.id })
        .from(providers)
        .where(
          and(
            eq(providers.tenantId, pTenantId),
            eq(providers.slug, input.slug),
            sql`${providers.id} != ${pProviderId}`
          )
        )
        .limit(1);

      if (existingSlug) {
        throw new AppError(409, "A provider with this slug already exists.");
      }
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.slug !== undefined) updatePayload.slug = input.slug;
    if (input.category !== undefined) updatePayload.category = input.category;
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.bio !== undefined) updatePayload.bio = input.bio;
    if (input.avatarUrl !== undefined) updatePayload.avatarUrl = input.avatarUrl;
    if (input.isActive !== undefined) updatePayload.isActive = input.isActive;

    const [updated] = await tx
      .update(providers)
      .set(updatePayload)
      .where(
        and(
          eq(providers.id, pProviderId),
          eq(providers.tenantId, pTenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Provider not found.");
    }

    return updated;
  });
}

/**
 * Links a provider to an application user account.
 */
export async function linkUserToProvider(
  tenantId: number | bigint,
  adminUserId: string,
  providerId: number | bigint | string,
  input: LinkUserToProviderInput
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(providerId);

  return await withTenantContext(pTenantId, adminUserId, async (tx) => {
    // 1. Verify user exists[cite: 1]
    // const [user] = await tx
    //   .select({ id: users.id })
    //   .from(users)
    //   .where(eq(users.id, input.userId))
    //   .limit(1);

    // if (!user) {
    //   throw new AppError(404, "User account not found.");
    // }

    // 2. Link provider[cite: 1]
    const [updated] = await tx
      .update(providers)
      .set({
        userId: input.userId,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(providers.id, pProviderId),
          eq(providers.tenantId, pTenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Provider not found.");
    }

    return updated;
  });
}

/**
 * Soft deletes a provider.
 */
export async function deleteProvider(
  tenantId: number | bigint,
  userId: string,
  providerId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(providerId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const [deleted] = await tx
      .update(providers)
      .set({
        isActive: false,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(providers.id, pProviderId),
          eq(providers.tenantId, pTenantId)
        )
      )
      .returning({ id: providers.id });

    if (!deleted) {
      throw new AppError(404, "Provider not found.");
    }

    return { success: true };
  });
}

export async function getProvidersByCategory(
  tenantId: number | bigint,
  category: string
) {
  const pTenantId = Number(tenantId);

  return await db
    .select({
      id: providers.id,
      name: providers.name,
      slug: providers.slug,
      category: providers.category,
      title: providers.title,
      bio: providers.bio,
      avatarUrl: providers.avatarUrl,
    })
    .from(providers)
    .where(
      and(
        eq(providers.tenantId, pTenantId),
        eq(providers.category, category),
        eq(providers.isActive, true)
      )
    )
    .orderBy(asc(providers.name));
}

/**
 * Fetches a single provider by tenantId and slug, resolving services with overrides.
 */
export async function getProviderBySlug(
  tenantId: number | bigint,
  slug: string
) {
  const pTenantId = Number(tenantId);

  const [provider] = await db
    .select({
      id: providers.id,
      name: providers.name,
      slug: providers.slug,
      category: providers.category,
      title: providers.title,
      bio: providers.bio,
      avatarUrl: providers.avatarUrl,
    })
    .from(providers)
    .where(
      and(
        eq(providers.tenantId, pTenantId),
        eq(providers.slug, slug),
        eq(providers.isActive, true)
      )
    )
    .limit(1);

  if (!provider) return null;

  // Resolve only services explicitly linked and active for this provider
  const linkedServices = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      description: services.description,
      basePrice: services.price,
      priceOverride: providerServices.priceOverride,
      baseDurationMinutes: services.durationMinutes,
      durationOverrideMinutes: providerServices.durationOverrideMinutes,
      effectivePrice: sql<string>`COALESCE(${providerServices.priceOverride}, ${services.price})`.as("effective_price"),
      effectiveDuration: sql<number>`COALESCE(${providerServices.durationOverrideMinutes}, ${services.durationMinutes})`.as("effective_duration"),
    })
    .from(providerServices)
    .innerJoin(services, eq(services.id, providerServices.serviceId))
    .where(
      and(
        eq(providerServices.tenantId, pTenantId),
        eq(providerServices.providerId, provider.id),
        eq(providerServices.isActive, true),
        eq(services.isActive, true)
      )
    );

  return {
    ...provider,
    services: linkedServices,
  };
}


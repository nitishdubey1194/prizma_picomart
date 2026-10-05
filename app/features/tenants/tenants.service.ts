import { db } from "@/lib/db/index";
import { tenants, tenantUsers, themes, plans } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, sql } from "drizzle-orm";

export interface CreateTenantInput {
  name: string;
  subdomain: string;
  planId: number;
  themeId?: number | null;
}

export interface UpdateTenantInput {
  name?: string;
  subdomain?: string;
  planId?: number;
  themeId?: number | null;
  isActive?: boolean;
}

export interface TenantWithTheme {
  id: string;
  name: string;
  subdomain: string;
  planId: number;
  themeId: number | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  theme?: {
    id: number;
    name: string;
    themeJson: unknown;
  } | null;
  plan?: {
    id: number;
    name: string;
    slug: string;
    price: string;
    maxProducts: number | null;
  } | null;
}

/**
 * Resolves a tenant by its unique subdomain along with its assigned theme configuration and plan.
 */
export async function getTenantBySubdomain(
  subdomain: string
): Promise<TenantWithTheme | null> {
  const cleanSubdomain = subdomain.trim().toLowerCase();

  const [row] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      subdomain: tenants.subdomain,
      planId: tenants.planId,
      themeId: tenants.themeId,
      isActive: tenants.isActive,
      createdAt: tenants.createdAt,
      updatedAt: tenants.updatedAt,
      theme: {
        id: themes.id,
        name: themes.name,
        themeJson: themes.themeJson,
      },
      plan: {
        id: plans.id,
        name: plans.name,
        slug: plans.slug,
        price: plans.price,
        maxProducts: plans.maxProducts,
      },
    })
    .from(tenants)
    .leftJoin(themes, eq(themes.id, tenants.themeId))
    .leftJoin(plans, eq(plans.id, tenants.planId))
    .where(
      and(
        eq(tenants.subdomain, cleanSubdomain),
        eq(tenants.isActive, true)
      )
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    ...row,
    id: row.id.toString(),
  };
}

/**
 * Retrieves tenant metadata by numeric/bigint ID.
 */
export async function getTenantById(
  tenantId: number | bigint | string
): Promise<TenantWithTheme | null> {
  const pTenantIdBigInt = Number(tenantId);

  const [row] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      subdomain: tenants.subdomain,
      planId: tenants.planId,
      themeId: tenants.themeId,
      isActive: tenants.isActive,
      createdAt: tenants.createdAt,
      updatedAt: tenants.updatedAt,
      theme: {
        id: themes.id,
        name: themes.name,
        themeJson: themes.themeJson,
      },
      plan: {
        id: plans.id,
        name: plans.name,
        slug: plans.slug,
        price: plans.price,
        maxProducts: plans.maxProducts,
      },
    })
    .from(tenants)
    .leftJoin(themes, eq(themes.id, tenants.themeId))
    .leftJoin(plans, eq(plans.id, tenants.planId))
    .where(eq(tenants.id, pTenantIdBigInt))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    ...row,
    id: row.id.toString(),
  };
}

/**
 * Provisions a new tenant and assigns the authenticated creator as the initial 'admin' in tenant_users.
 */
export async function createTenant(
  ownerUserId: string,
  input: CreateTenantInput
) {
  const cleanSubdomain = input.subdomain.trim().toLowerCase();

  // 1. Ensure subdomain conforms to URL guidelines
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
  if (!subdomainRegex.test(cleanSubdomain)) {
    throw new AppError(
      400,
      "Subdomain must contain only lowercase letters, numbers, and hyphens (2-63 chars), and cannot start/end with a hyphen."
    );
  }

  // Check subdomain availability
  const [existingTenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.subdomain, cleanSubdomain))
    .limit(1);

  if (existingTenant) {
    throw new AppError(409, "This subdomain is already taken.");
  }

  // Verify target subscription plan exists
  const [targetPlan] = await db
    .select({ id: plans.id, isActive: plans.isActive })
    .from(plans)
    .where(eq(plans.id, input.planId))
    .limit(1);

  if (!targetPlan || !targetPlan.isActive) {
    throw new AppError(404, "Invalid or inactive plan selected.");
  }

  // Verify theme if supplied
  if (input.themeId) {
    const [targetTheme] = await db
      .select({ id: themes.id })
      .from(themes)
      .where(
        and(
          eq(themes.id, input.themeId),
          eq(themes.isActive, true)
        )
      )
      .limit(1);

    if (!targetTheme) {
      throw new AppError(404, "Selected theme not found or inactive.");
    }
  }

  // Execute creation within a database transaction
  return await db.transaction(async (tx) => {
    const [newTenant] = await tx
      .insert(tenants)
      .values({
        // userId: ownerUserId,
        subdomain: cleanSubdomain,
        name: input.name,
        planId: input.planId,
        themeId: input.themeId ?? null,
        isActive: true,
      })
      .returning();

    // Map owner into tenant_users with 'admin' role
    await tx.insert(tenantUsers).values({
      tenantId: Number(newTenant.id),
      userId: ownerUserId,
      role: "admin",
      isActive: true,
    });

    return {
      ...newTenant,
      id: newTenant.id.toString(),
    };
  });
}

/**
 * Updates an existing tenant configuration.
 */
export async function updateTenant(
  tenantId: number | bigint | string,
  userId: string,
  input: UpdateTenantInput
) {
  const pTenantId = Number(tenantId);
  const pTenantIdBigInt = Number(tenantId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // Check subdomain collisions if updating
    if (input.subdomain) {
      const cleanSubdomain = input.subdomain.trim().toLowerCase();

      const [conflict] = await tx
        .select({ id: tenants.id })
        .from(tenants)
        .where(
          and(
            eq(tenants.subdomain, cleanSubdomain),
            sql`${tenants.id} != ${pTenantIdBigInt}`
          )
        )
        .limit(1);

      if (conflict) {
        throw new AppError(409, "This subdomain is already taken.");
      }
    }

    // Validate theme if updated
    if (input.themeId !== undefined && input.themeId !== null) {
      const [targetTheme] = await tx
        .select({ id: themes.id })
        .from(themes)
        .where(
          and(
            eq(themes.id, input.themeId),
            eq(themes.isActive, true)
          )
        )
        .limit(1);

      if (!targetTheme) {
        throw new AppError(404, "Selected theme not found or inactive.");
      }
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.subdomain !== undefined) updatePayload.subdomain = input.subdomain.trim().toLowerCase();
    if (input.planId !== undefined) updatePayload.planId = input.planId;
    if (input.themeId !== undefined) updatePayload.themeId = input.themeId;
    if (input.isActive !== undefined) updatePayload.isActive = input.isActive;

    const [updated] = await tx
      .update(tenants)
      .set(updatePayload)
      .where(eq(tenants.id, pTenantIdBigInt))
      .returning();

    if (!updated) {
      throw new AppError(404, "Tenant not found.");
    }

    return {
      ...updated,
      id: updated.id.toString(),
    };
  });
}
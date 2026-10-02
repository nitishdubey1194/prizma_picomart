import { db } from "@/lib/db";
import { categories } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, sql, desc, asc } from "drizzle-orm";

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  parentId?: number | bigint | string | null;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: number | bigint | string | null;
  isActive?: boolean;
}

/**
 * Retrieves all active categories for a tenant, including subcategory hierarchy.
 */
export async function getTenantCategories(tenantId: number | bigint) {
  const pTenantId = Number(tenantId);

  const rows = await db
    .select({
      id: categories.id,
      tenantId: categories.tenantId,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      parentId: categories.parentId,
      isActive: categories.isActive,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
    })
    .from(categories)
    .where(
      and(
        eq(categories.tenantId, pTenantId),
        eq(categories.isActive, true)
      )
    )
    .orderBy(asc(categories.name));

  return rows.map((cat) => ({
    ...cat,
    id: cat.id.toString(),
  }));
}

/**
 * Fetches a single category by its ID.
 */
export async function getCategoryById(
  tenantId: number | bigint,
  categoryId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pCategoryIdBigInt = Number(categoryId);

  const [category] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.id, pCategoryIdBigInt),
        eq(categories.tenantId, pTenantId),
        eq(categories.isActive, true)
      )
    )
    .limit(1);

  if (!category) {
    return null;
  }

  return {
    ...category,
    id: category.id.toString(),
  };
}

/**
 * Creates a new category under the tenant context.
 */
export async function createCategory(
  tenantId: number | bigint,
  userId: string,
  input: CreateCategoryInput
) {
  const pTenantId = Number(tenantId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // 1. Verify slug uniqueness for this tenant[cite: 1]
    const [existingSlug] = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.tenantId, pTenantId),
          eq(categories.slug, input.slug)
        )
      )
      .limit(1);

    if (existingSlug) {
      throw new AppError(409, "A category with this slug already exists.");
    }

    // 2. Validate parent category if provided[cite: 1]
    if (input.parentId) {
      const [parent] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            eq(categories.id, Number(input.parentId)),
            eq(categories.tenantId, pTenantId)
          )
        )
        .limit(1);

      if (!parent) {
        throw new AppError(404, "Parent category not found.");
      }
    }

    // 3. Insert category[cite: 1]
    const [newCategory] = await tx
      .insert(categories)
      .values({
        tenantId: pTenantId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        parentId: input.parentId != null ? Number(input.parentId) : null,
        isActive: input.isActive ?? true,
      })
      .returning();

    return {
      ...newCategory,
      id: newCategory.id.toString(),
    };
  });
}

/**
 * Updates an existing category.
 */
export async function updateCategory(
  tenantId: number | bigint,
  userId: string,
  categoryId: number | bigint | string,
  input: UpdateCategoryInput
) {
  const pTenantId = Number(tenantId);
  const pCategoryIdBigInt = BigInt(categoryId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // Prevent setting self as parent category[cite: 1]
    if (input.parentId != null && BigInt(input.parentId) === pCategoryIdBigInt) {
      throw new AppError(400, "A category cannot be its own parent.");
    }

    // Check slug collision[cite: 1]
    if (input.slug) {
      const [existingSlug] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            eq(categories.tenantId, pTenantId),
            eq(categories.slug, input.slug),
            sql`${categories.id} != ${pCategoryIdBigInt}`
          )
        )
        .limit(1);

      if (existingSlug) {
        throw new AppError(409, "A category with this slug already exists.");
      }
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.slug !== undefined) updatePayload.slug = input.slug;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.parentId !== undefined) {
      updatePayload.parentId = input.parentId != null ? Number(input.parentId) : null;
    }
    if (input.isActive !== undefined) updatePayload.isActive = input.isActive;

    const [updated] = await tx
      .update(categories)
      .set(updatePayload)
      .where(
        and(
          eq(categories.id, Number(pCategoryIdBigInt)),
          eq(categories.tenantId, pTenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Category not found.");
    }

    return {
      ...updated,
      id: updated.id.toString(),
    };
  });
}

/**
 * Soft deletes a category by disabling its active state.
 */
export async function deleteCategory(
  tenantId: number | bigint,
  userId: string,
  categoryId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pCategoryIdBigInt = BigInt(categoryId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const [deleted] = await tx
      .update(categories)
      .set({
        isActive: false,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(categories.id, Number(pCategoryIdBigInt)),
          eq(categories.tenantId, pTenantId)
        )
      )
      .returning({ id: categories.id });

    if (!deleted) {
      throw new AppError(404, "Category not found.");
    }

    return { success: true };
  });
}
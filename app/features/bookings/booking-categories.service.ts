import { db } from "@/lib/db";
import { bookingCategories } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, asc, sql } from "drizzle-orm";

export interface CreateBookingCategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateBookingCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface BookingCategoryRecord {
  id: number;
  tenantId: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lists all active booking categories for a tenant.
 */
export async function getTenantBookingCategories(
  tenantId: number | bigint
): Promise<BookingCategoryRecord[]> {
  const pTenantId = Number(tenantId);

  return await db
    .select()
    .from(bookingCategories)
    .where(
      and(
        eq(bookingCategories.tenantId, pTenantId),
        eq(bookingCategories.isActive, true)
      )
    )
    .orderBy(asc(bookingCategories.name));
}

/**
 * Creates a new booking category within tenant context.
 */
export async function createBookingCategory(
  tenantId: number | bigint,
  userId: string,
  input: CreateBookingCategoryInput
): Promise<BookingCategoryRecord> {
  const pTenantId = Number(tenantId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const [existing] = await tx
      .select({ id: bookingCategories.id })
      .from(bookingCategories)
      .where(
        and(
          eq(bookingCategories.tenantId, pTenantId),
          eq(bookingCategories.slug, input.slug)
        )
      )
      .limit(1);

    if (existing) {
      throw new AppError(409, "A booking category with this slug already exists.");
    }

    const [created] = await tx
      .insert(bookingCategories)
      .values({
        tenantId: pTenantId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        isActive: input.isActive ?? true,
      })
      .returning();

    return created;
  });
}

/**
 * Updates a booking category.
 */
export async function updateBookingCategory(
  tenantId: number | bigint,
  userId: string,
  categoryId: number | bigint | string,
  input: UpdateBookingCategoryInput
): Promise<BookingCategoryRecord> {
  const pTenantId = Number(tenantId);
  const pCategoryId = Number(categoryId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    if (input.slug) {
      const [existing] = await tx
        .select({ id: bookingCategories.id })
        .from(bookingCategories)
        .where(
          and(
            eq(bookingCategories.tenantId, pTenantId),
            eq(bookingCategories.slug, input.slug),
            sql`${bookingCategories.id} != ${pCategoryId}`
          )
        )
        .limit(1);

      if (existing) {
        throw new AppError(409, "A booking category with this slug already exists.");
      }
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.slug !== undefined) updatePayload.slug = input.slug;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.isActive !== undefined) updatePayload.isActive = input.isActive;

    const [updated] = await tx
      .update(bookingCategories)
      .set(updatePayload)
      .where(
        and(
          eq(bookingCategories.id, pCategoryId),
          eq(bookingCategories.tenantId, pTenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Booking category not found.");
    }

    return updated;
  });
}

/**
 * Soft deletes a booking category.
 */
export async function deleteBookingCategory(
  tenantId: number | bigint,
  userId: string,
  categoryId: number | bigint | string
): Promise<{ success: boolean }> {
  const pTenantId = Number(tenantId);
  const pCategoryId = Number(categoryId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const [deleted] = await tx
      .update(bookingCategories)
      .set({
        isActive: false,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(bookingCategories.id, pCategoryId),
          eq(bookingCategories.tenantId, pTenantId)
        )
      )
      .returning({ id: bookingCategories.id });

    if (!deleted) {
      throw new AppError(404, "Booking category not found.");
    }

    return { success: true };
  });
}
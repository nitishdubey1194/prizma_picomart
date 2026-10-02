import { db } from "@/lib/db";
import { products, productVariants, productImages, categories } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, ilike, desc, sql } from "drizzle-orm";

export interface CreateProductInput {
  name: string;
  slug: string;
  sku?: string | null;
  description?: string | null;
  categoryId?: number | bigint | string | null;
  storeId?: number | bigint | string | null;
  isActive?: boolean;
  featured?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  sku?: string | null;
  description?: string | null;
  categoryId?: number | bigint | string | null;
  storeId?: number | bigint | string | null;
  isActive?: boolean;
  featured?: boolean;
}

export interface ProductFilterOptions {
  categoryId?: number | bigint | string;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Lists products for the tenant with pagination and optional search/category filters.
 */
export async function getTenantProducts(
  tenantId: number | bigint,
  options: ProductFilterOptions = {}
) {
  const pTenantId = Number(tenantId);
  const limit = Math.min(Math.max(1, options.limit ?? 20), 100);
  const offset = Math.max(0, options.offset ?? 0);

  const conditions = [
    eq(products.tenantId, pTenantId),
    eq(products.isActive, true),
  ];

  if (options.categoryId) {
    conditions.push(eq(products.categoryId, Number(options.categoryId)));
  }

  if (options.featured !== undefined) {
    conditions.push(eq(products.featured, options.featured));
  }

  if (options.search?.trim()) {
    conditions.push(ilike(products.name, `%${options.search.trim()}%`));
  }

  const rows = await db
    .select({
      id: products.id,
      tenantId: products.tenantId,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      description: products.description,
      categoryId: products.categoryId,
      storeId: products.storeId,
      featured: products.featured,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(
      categories,
      sql`${categories.id} = ${products.categoryId}`
    )
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((p) => ({
    ...p,
    id: p.id.toString(),
  }));
}

/**
 * Fetches a single product by ID or slug, along with its active variants and images.
 */
export async function getProductById(
  tenantId: number | bigint,
  productId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pProductIdBigInt = Number(productId);
  const pProductIdNum = Number(productId);

  const [product] = await db
    .select({
      id: products.id,
      tenantId: products.tenantId,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      description: products.description,
      categoryId: products.categoryId,
      storeId: products.storeId,
      featured: products.featured,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(
      and(
        eq(products.id, pProductIdBigInt),
        eq(products.tenantId, pTenantId),
        eq(products.isActive, true)
      )
    )
    .limit(1);

  if (!product) {
    return null;
  }

  // Fetch linked variants and gallery images
  const [variants, images] = await Promise.all([
    db
      .select({
        id: productVariants.id,
        variantName: productVariants.variantName,
        sku: productVariants.sku,
        price: productVariants.price,
        discountPrice: productVariants.discountPrice,
        stockQty: productVariants.stockQty,
        maxBuyQty: productVariants.maxBuyQty,
        attributesJson: productVariants.attributesJson,
      })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, pProductIdNum),
          eq(productVariants.tenantId, pTenantId)
        )
      ),
    db
      .select({
        id: productImages.id,
        imageUrl: productImages.imageUrl,
        isPrimary: productImages.isPrimary,
      })
      .from(productImages)
      .where(
        and(
          eq(productImages.productId, pProductIdNum),
          eq(productImages.tenantId, pTenantId)
        )
      )
      .orderBy(desc(productImages.isPrimary)),
  ]);

  return {
    ...product,
    id: product.id.toString(),
    variants: variants.map((v) => ({ ...v, id: v.id.toString() })),
    images: images.map((img) => ({ ...img, id: img.id.toString() })),
  };
}

/**
 * Creates a product within the tenant context.
 */
export async function createProduct(
  tenantId: number | bigint,
  userId: string,
  input: CreateProductInput
) {
  const pTenantId = Number(tenantId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // 1. Ensure slug is unique for this tenant[cite: 1]
    const [existingSlug] = await tx
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.tenantId, pTenantId),
          eq(products.slug, input.slug)
        )
      )
      .limit(1);

    if (existingSlug) {
      throw new AppError(409, "A product with this slug already exists.");
    }

    // 2. Validate category if provided[cite: 1]
    if (input.categoryId) {
      const [category] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            eq(categories.id, Number(input.categoryId)),
            eq(categories.tenantId, pTenantId)
          )
        )
        .limit(1);

      if (!category) {
        throw new AppError(404, "Specified category not found.");
      }
    }

    // 3. Insert product[cite: 1]
    const [newProduct] = await tx
      .insert(products)
      .values({
        tenantId: pTenantId,
        name: input.name,
        slug: input.slug,
        sku: input.sku ?? null,
        description: input.description ?? null,
        categoryId: input.categoryId != null ? Number(input.categoryId) : null,
        storeId: input.storeId != null ? Number(input.storeId) : null,
        isActive: input.isActive ?? true,
        featured: input.featured ?? false,
      })
      .returning();

    return {
      ...newProduct,
      id: newProduct.id.toString(),
    };
  });
}

/**
 * Updates product attributes.
 */
export async function updateProduct(
  tenantId: number | bigint,
  userId: string,
  productId: number | bigint | string,
  input: UpdateProductInput
) {
  const pTenantId = Number(tenantId);
  const pProductIdBigInt = Number(productId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // Check if new slug collides with another product[cite: 1]
    if (input.slug) {
      const [existingSlug] = await tx
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            eq(products.tenantId, pTenantId),
            eq(products.slug, input.slug),
            sql`${products.id} != ${pProductIdBigInt}`
          )
        )
        .limit(1);

      if (existingSlug) {
        throw new AppError(409, "A product with this slug already exists.");
      }
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.slug !== undefined) updatePayload.slug = input.slug;
    if (input.sku !== undefined) updatePayload.sku = input.sku;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.categoryId !== undefined) {
      updatePayload.categoryId = input.categoryId != null ? Number(input.categoryId) : null;
    }
    if (input.storeId !== undefined) {
      updatePayload.storeId = input.storeId != null ? Number(input.storeId) : null;
    }
    if (input.isActive !== undefined) updatePayload.isActive = input.isActive;
    if (input.featured !== undefined) updatePayload.featured = input.featured;

    const [updated] = await tx
      .update(products)
      .set(updatePayload)
      .where(
        and(
          eq(products.id, pProductIdBigInt),
          eq(products.tenantId, pTenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Product not found.");
    }

    return {
      ...updated,
      id: updated.id.toString(),
    };
  });
}

/**
 * Soft deletes a product by disabling its active state.
 */
export async function deleteProduct(
  tenantId: number | bigint,
  userId: string,
  productId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pProductIdBigInt = Number(productId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const [deleted] = await tx
      .update(products)
      .set({
        isActive: false,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(products.id, pProductIdBigInt),
          eq(products.tenantId, pTenantId)
        )
      )
      .returning({ id: products.id });

    if (!deleted) {
      throw new AppError(404, "Product not found.");
    }

    return { success: true };
  });
}
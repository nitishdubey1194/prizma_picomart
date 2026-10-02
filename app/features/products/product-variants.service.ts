import { db } from "@/lib/db";
import { productVariants, products } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, sql } from "drizzle-orm";
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export interface VariantAttributes {
  [key: string]: JsonValue;
}
export interface CreateVariantInput {
  variantName: string;
  sku?: string | null;
  price: string | number;
  discountPrice?: string | number | null;
  stockQty?: number;
  maxBuyQty?: number | null;
  attributesJson?: Record<string, unknown> | null;
}

export interface UpdateVariantInput {
  variantName?: string;
  sku?: string | null;
  price?: string | number;
  discountPrice?: string | number | null;
  stockQty?: number;
  maxBuyQty?: number | null;
  attributesJson?: Record<string, unknown> | null;
}

/**
 * Retrieves all variants for a specific product under a tenant.
 */
export async function getVariantsByProduct(
  tenantId: number | bigint,
  productId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pProductId = Number(productId);

  const rows = await db
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      tenantId: productVariants.tenantId,
      variantName: productVariants.variantName,
      sku: productVariants.sku,
      price: productVariants.price,
      discountPrice: productVariants.discountPrice,
      stockQty: productVariants.stockQty,
      maxBuyQty: productVariants.maxBuyQty,
      attributesJson: productVariants.attributesJson,
      createdAt: productVariants.createdAt,
      updatedAt: productVariants.updatedAt,
    })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.productId, pProductId),
        eq(productVariants.tenantId, pTenantId)
      )
    );

  return rows.map((variant) => ({
    ...variant,
    id: variant.id.toString(),
  }));
}

/**
 * Creates a new SKU / variant for a product.
 */
export async function createProductVariant(
  tenantId: number | bigint,
  userId: string,
  productId: number | bigint | string,
  input: CreateVariantInput
) {
  const pTenantId = Number(tenantId);
  const pProductId = Number(productId);
  const pProductIdBigInt = Number(productId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // 1. Validate that the parent product belongs to this tenant[cite: 1]
    const [product] = await tx
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.id, pProductIdBigInt),
          eq(products.tenantId, pTenantId)
        )
      )
      .limit(1);

    if (!product) {
      throw new AppError(404, "Parent product not found for this tenant.");
    }

    // 2. Insert variant[cite: 1]
    const [newVariant] = await tx
      .insert(productVariants)
      .values({
        tenantId: pTenantId,
        productId: pProductId,
        variantName: input.variantName,
        sku: input.sku ?? null,
        price: String(input.price),
        discountPrice:
          input.discountPrice != null ? String(input.discountPrice) : null,
        stockQty: input.stockQty ?? 0,
        maxBuyQty: input.maxBuyQty ?? null,
        attributesJson: input.attributesJson ?? null,
      })
      .returning();

    return {
      ...newVariant,
      id: newVariant.id.toString(),
    };
  });
}

/**
 * Updates an existing variant's price, stock, or attributes.
 */
export async function updateProductVariant(
  tenantId: number | bigint,
  userId: string,
  variantId: number | bigint | string,
  input: UpdateVariantInput
) {
  const pTenantId = Number(tenantId);
  const pVariantIdBigInt = Number(variantId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const updateValues: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (input.variantName !== undefined) updateValues.variantName = input.variantName;
    if (input.sku !== undefined) updateValues.sku = input.sku;
    if (input.price !== undefined) updateValues.price = String(input.price);
    if (input.discountPrice !== undefined) {
      updateValues.discountPrice =
        input.discountPrice != null ? String(input.discountPrice) : null;
    }
    if (input.stockQty !== undefined) updateValues.stockQty = input.stockQty;
    if (input.maxBuyQty !== undefined) updateValues.maxBuyQty = input.maxBuyQty;
    if (input.attributesJson !== undefined) updateValues.attributesJson = input.attributesJson;

    const [updated] = await tx
      .update(productVariants)
      .set(updateValues)
      .where(
        and(
          eq(productVariants.id, pVariantIdBigInt),
          eq(productVariants.tenantId, pTenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Product variant not found.");
    }

    return {
      ...updated,
      id: updated.id.toString(),
    };
  });
}

/**
 * Deletes a variant from a product.
 */
export async function deleteProductVariant(
  tenantId: number | bigint,
  userId: string,
  variantId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pVariantIdBigInt = Number(variantId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const deleted = await tx
      .delete(productVariants)
      .where(
        and(
          eq(productVariants.id, pVariantIdBigInt),
          eq(productVariants.tenantId, pTenantId)
        )
      )
      .returning({ id: productVariants.id });

    if (!deleted.length) {
      throw new AppError(404, "Product variant not found.");
    }

    return { success: true };
  });
}
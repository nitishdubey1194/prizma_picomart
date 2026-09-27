import { db } from "@/lib/db";
import { productImages, products } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, desc } from "drizzle-orm";

export interface AddProductImageInput {
  imageUrl: string;
  isPrimary?: boolean;
}

export interface UpdateProductImageInput {
  imageUrl?: string;
  isPrimary?: boolean;
}

/**
 * Lists all gallery images for a given product.
 */
export async function getProductImages(
  tenantId: number | bigint,
  productId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pProductId = Number(productId);

  const images = await db
    .select({
      id: productImages.id,
      productId: productImages.productId,
      tenantId: productImages.tenantId,
      imageUrl: productImages.imageUrl,
      isPrimary: productImages.isPrimary,
      createdAt: productImages.createdAt,
    })
    .from(productImages)
    .where(
      and(
        eq(productImages.productId, pProductId),
        eq(productImages.tenantId, pTenantId)
      )
    )
    .orderBy(desc(productImages.isPrimary), desc(productImages.createdAt));

  return images.map((img) => ({
    ...img,
    id: img.id.toString(),
  }));
}

/**
 * Adds an image to a product. If set as primary, unsets existing primary image first.
 */
export async function addProductImage(
  tenantId: number | bigint,
  userId: string,
  productId: number | bigint | string,
  input: AddProductImageInput
) {
  const pTenantId = Number(tenantId);
  const pProductId = Number(productId);
  const pProductIdBigInt = BigInt(productId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // 1. Verify parent product exists under this tenant[cite: 1]
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
      throw new AppError(404, "Product not found for this tenant.");
    }

    // 2. Unset previous primary image if setting new image as primary[cite: 1]
    if (input.isPrimary) {
      await tx
        .update(productImages)
        .set({ isPrimary: false })
        .where(
          and(
            eq(productImages.productId, pProductId),
            eq(productImages.tenantId, pTenantId)
          )
        );
    }

    // 3. Insert new product image[cite: 1]
    const [newImage] = await tx
      .insert(productImages)
      .values({
        tenantId: pTenantId,
        productId: pProductId,
        imageUrl: input.imageUrl,
        isPrimary: input.isPrimary ?? false,
      })
      .returning();

    return {
      ...newImage,
      id: newImage.id.toString(),
    };
  });
}

/**
 * Updates image properties (e.g. promoting an image to primary).
 */
export async function updateProductImage(
  tenantId: number | bigint,
  userId: string,
  productId: number | bigint | string,
  imageId: number | bigint | string,
  input: UpdateProductImageInput
) {
  const pTenantId = Number(tenantId);
  const pProductId = Number(productId);
  const pImageIdBigInt = BigInt(imageId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // If setting as primary, demote existing primary images for this product[cite: 1]
    if (input.isPrimary) {
      await tx
        .update(productImages)
        .set({ isPrimary: false })
        .where(
          and(
            eq(productImages.productId, pProductId),
            eq(productImages.tenantId, pTenantId)
          )
        );
    }

    const updatePayload: Record<string, unknown> = {};
    if (input.imageUrl !== undefined) updatePayload.imageUrl = input.imageUrl;
    if (input.isPrimary !== undefined) updatePayload.isPrimary = input.isPrimary;

    const [updated] = await tx
      .update(productImages)
      .set(updatePayload)
      .where(
        and(
          eq(productImages.id, pImageIdBigInt),
          eq(productImages.productId, pProductId),
          eq(productImages.tenantId, pTenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Product image not found.");
    }

    return {
      ...updated,
      id: updated.id.toString(),
    };
  });
}

/**
 * Deletes an image record from a product.
 */
export async function deleteProductImage(
  tenantId: number | bigint,
  userId: string,
  productId: number | bigint | string,
  imageId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pProductId = Number(productId);
  const pImageIdBigInt = BigInt(imageId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const deleted = await tx
      .delete(productImages)
      .where(
        and(
          eq(productImages.id, pImageIdBigInt),
          eq(productImages.productId, pProductId),
          eq(productImages.tenantId, pTenantId)
        )
      )
      .returning({ id: productImages.id });

    if (!deleted.length) {
      throw new AppError(404, "Product image not found.");
    }

    return { success: true };
  });
}
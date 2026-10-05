import { db } from "@/lib/db/index";
import { productImages, products } from "@/drizzle/schema";
import { assertTenantRecordExists, withTenantContext } from "@/lib/tenant";
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
  const pProductIdBigInt = Number(productId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    await assertTenantRecordExists(
      tx,
      products,
      pTenantId,
      pProductIdBigInt,
      "Product not found for this tenant."
    );

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

    // Insert new product image
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
  const pImageIdBigInt = Number(imageId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // If setting as primary, demote existing primary images for this product
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
  const pImageIdBigInt = Number(imageId);

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
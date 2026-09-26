import { PoolClient } from "pg";
import { ProductImage } from "./product-images.types";

function mapRow(row: { id: string; product_id: string; image_url: string; is_primary: boolean; created_at: string }): ProductImage {
  return {
    id: Number(row.id),
    productId: Number(row.product_id),
    imageUrl: row.image_url,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
  };
}

export async function listImages(client: PoolClient, productId: number): Promise<ProductImage[]> {
  const result = await client.query(
    "select * from product_images where product_id = $1 order by is_primary desc, created_at",
    [productId]
  );
  return result.rows.map(mapRow);
}

export async function addImage(
  client: PoolClient,
  tenantId: number,
  productId: number,
  data: { imageUrl: string; isPrimary?: boolean }
): Promise<ProductImage> {
  if (data.isPrimary) {
    await client.query("update product_images set is_primary = false where product_id = $1", [productId]);
  }
  const result = await client.query(
    `insert into product_images (tenant_id, product_id, image_url, is_primary)
     values ($1, $2, $3, $4)
     returning *`,
    [tenantId, productId, data.imageUrl, data.isPrimary ?? false]
  );
  return mapRow(result.rows[0]);
}

export async function setPrimaryImage(client: PoolClient, productId: number, imageId: number): Promise<ProductImage | null> {
  await client.query("update product_images set is_primary = false where product_id = $1", [productId]);
  const result = await client.query(
    "update product_images set is_primary = true where id = $1 and product_id = $2 returning *",
    [imageId, productId]
  );
  return result.rowCount ? mapRow(result.rows[0]) : null;
}

export async function deleteImage(client: PoolClient, id: number): Promise<boolean> {
  const result = await client.query("delete from product_images where id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
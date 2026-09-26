import { PoolClient } from "pg";
import { ProductVariant } from "./products.types";

function mapRow(row: { id: string; product_id: string; tenant_id: string; variant_name: string; sku: string | null; price: string; discount_price: string | null; stock_qty: number; max_buy_qty: number | null, attributes_json: Record<string, unknown> | null; created_at: string; updated_at: string }): ProductVariant {
  return {
    id: Number(row.id),
    productId: Number(row.product_id),
    tenantId: Number(row.tenant_id),
    variantName: row.variant_name,
    sku: row.sku,
    price: Number(row.price),
    discountPrice: row.discount_price !== null ? Number(row.discount_price) : null,
    stockQty: row.stock_qty,
    maxBuyQty: row.max_buy_qty,
    attributes: row.attributes_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listVariants(client: PoolClient, productId: number): Promise<ProductVariant[]> {
  const result = await client.query(
    "select * from product_variants where product_id = $1 order by created_at",
    [productId]
  );
  return result.rows.map(mapRow);
}

export async function createVariant(
  client: PoolClient,
  tenantId: number,
  productId: number,
  data: { variantName: string; sku?: string; price: number; discountPrice?: number; stockQty?: number; maxBuyQty?: number; attributes?: Record<string, unknown> }
): Promise<ProductVariant> {
  const result = await client.query(
    `insert into product_variants (tenant_id, product_id, variant_name, sku, price, discount_price, stock_qty, max_buy_qty, attributes_json)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning *`,
    [tenantId, productId, data.variantName, data.sku ?? null, data.price, data.discountPrice ?? null, data.stockQty ?? 0, data.maxBuyQty ?? null, data.attributes ?? null]
  );
  return mapRow(result.rows[0]);
}

export async function updateVariant(
  client: PoolClient,
  id: number,
  data: Partial<{ variantName: string; sku: string; price: number; discountPrice: number; stockQty: number; maxBuyQty: number; attributes: Record<string, unknown> }>
): Promise<ProductVariant | null> {
  const columnMap: Record<string, string> = {
    variantName: "variant_name",
    sku: "sku",
    price: "price",
    discountPrice: "discount_price",
    stockQty: "stock_qty",
    maxBuyQty: "max_buy_qty",
    attributes: "attributes_json",
  };

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, column] of Object.entries(columnMap)) {
    if (key in data) {
      fields.push(`${column} = $${i}`);
      values.push(data[key as keyof typeof data]);
      i++;
    }
  }

  if (fields.length === 0) {
    const existing = await client.query("select * from product_variants where id = $1", [id]);
    return existing.rowCount ? mapRow(existing.rows[0]) : null;
  }

  values.push(id);
  const result = await client.query(
    `update product_variants set ${fields.join(", ")} where id = $${i} returning *`,
    values
  );
  return result.rowCount ? mapRow(result.rows[0]) : null;
}

export async function deleteVariant(client: PoolClient, id: number): Promise<boolean> {
  const result = await client.query("delete from product_variants where id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
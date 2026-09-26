import { PoolClient } from "pg";
import { Product } from "./products.types";

function mapRow(row: { id: string; tenant_id: string; category_id: string | null; store_id: string | null; name: string; slug: string; sku: string | null; description: string | null; is_active: boolean; featured: boolean; created_at: string; updated_at: string }): Product {
  return {
    id: Number(row.id),
    tenantId: Number(row.tenant_id),
    categoryId: row.category_id !== null ? Number(row.category_id) : null,
    storeId: row.store_id !== null ? Number(row.store_id) : null,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    description: row.description,
    isActive: row.is_active,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProducts(client: PoolClient): Promise<Product[]> {
  const result = await client.query("select * from products order by created_at desc");
  return result.rows.map(mapRow);
}

export async function getProductById(client: PoolClient, id: number): Promise<Product | null> {
  const result = await client.query("select * from products where id = $1", [id]);
  return result.rowCount ? mapRow(result.rows[0]) : null;
}

export async function createProduct(
  client: PoolClient,
  tenantId: number,
  data: { name: string; slug: string; sku?: string; description?: string; categoryId?: number; featured?: boolean }
): Promise<Product> {
  const result = await client.query(
    `insert into products (tenant_id, name, slug, sku, description, category_id, featured)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [tenantId, data.name, data.slug, data.sku ?? null, data.description ?? null, data.categoryId ?? null, data.featured ?? false]
  );
  return mapRow(result.rows[0]);
}

export async function updateProduct(
  client: PoolClient,
  id: number,
  data: Partial<{ name: string; slug: string; sku: string; description: string; categoryId: number; featured: boolean; isActive: boolean }>
): Promise<Product | null> {
  const columnMap: Record<string, string> = {
    name: "name",
    slug: "slug",
    sku: "sku",
    description: "description",
    categoryId: "category_id",
    featured: "featured",
    isActive: "is_active",
  };

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, column] of Object.entries(columnMap)) {
    if (key in data) {
      fields.push(`${column} = $${i}`);
      values.push((data as { [key: string]: unknown })[key]);
      i++;
    }
  }

  if (fields.length === 0) return getProductById(client, id);

  fields.push("updated_at = now()");
  values.push(id);

  const result = await client.query(
    `update products set ${fields.join(", ")} where id = $${i} returning *`,
    values
  );
  return result.rowCount ? mapRow(result.rows[0]) : null;
}

export async function deleteProduct(client: PoolClient, id: number): Promise<boolean> {
  const result = await client.query("delete from products where id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
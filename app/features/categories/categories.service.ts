import { PoolClient } from "pg";
import { Category } from "./categories.types";

function mapRow(row: { id: string; tenant_id: string; name: string; slug: string; description: string | null; parent_id: string | null; is_active: boolean; created_at: string; updated_at: string }): Category {
  return {
    id: Number(row.id),
    tenantId: Number(row.tenant_id),
    name: row.name,
    slug: row.slug,
    description: row.description,
    parentId: row.parent_id !== null ? Number(row.parent_id) : null,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCategories(client: PoolClient): Promise<Category[]> {
  const result = await client.query("select * from categories order by name");
  return result.rows.map(mapRow);
}

export async function getCategoryById(client: PoolClient, id: number): Promise<Category | null> {
  const result = await client.query("select * from categories where id = $1", [id]);
  return result.rowCount ? mapRow(result.rows[0]) : null;
}

export async function createCategory(
  client: PoolClient,
  tenantId: number,
  data: { name: string; slug: string; description?: string; parentId?: number }
): Promise<Category> {
  const result = await client.query(
    `insert into categories (tenant_id, name, slug, description, parent_id)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [tenantId, data.name, data.slug, data.description ?? null, data.parentId ?? null]
  );
  return mapRow(result.rows[0]);
}

export async function updateCategory(
  client: PoolClient,
  id: number,
  data: Partial<{ name: string; slug: string; description: string; parentId: number; isActive: boolean }>
): Promise<Category | null> {
  const columnMap: Record<string, string> = {
    name: "name",
    slug: "slug",
    description: "description",
    parentId: "parent_id",
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

  if (fields.length === 0) return getCategoryById(client, id);

  fields.push("updated_at = now()");
  values.push(id);

  const result = await client.query(
    `update categories set ${fields.join(", ")} where id = $${i} returning *`,
    values
  );
  return result.rowCount ? mapRow(result.rows[0]) : null;
}

export async function deleteCategory(client: PoolClient, id: number): Promise<boolean> {
  const result = await client.query("delete from categories where id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
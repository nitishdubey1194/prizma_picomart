import { PoolClient } from "pg";
import { Service } from "./services.types";

function mapRow(row: { id: string; tenant_id: string; name: string; slug: string; description: string | null; duration_minutes: number; price: string; buffer_minutes: number; is_active: boolean; created_at: string; updated_at: string }): Service {
  return {
    id: Number(row.id),
    tenantId: Number(row.tenant_id),
    name: row.name,
    slug: row.slug,
    description: row.description,
    durationMinutes: row.duration_minutes,
    price: Number(row.price),
    bufferMinutes: row.buffer_minutes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listServices(client: PoolClient): Promise<Service[]> {
  const result = await client.query("select * from services order by created_at desc");
  return result.rows.map(mapRow);
}

export async function getServiceById(client: PoolClient, id: number): Promise<Service | null> {
  const result = await client.query("select * from services where id = $1", [id]);
  return result.rowCount ? mapRow(result.rows[0]) : null;
}

export async function createService(
  client: PoolClient,
  tenantId: number,
  data: { name: string; slug: string; description?: string; durationMinutes: number; price?: number; bufferMinutes?: number }
): Promise<Service> {
  const result = await client.query(
    `insert into services (tenant_id, name, slug, description, duration_minutes, price, buffer_minutes)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [tenantId, data.name, data.slug, data.description ?? null, data.durationMinutes, data.price ?? 0, data.bufferMinutes ?? 0]
  );
  return mapRow(result.rows[0]);
}

export async function updateService(
  client: PoolClient,
  id: number,
  data: Partial<{ name: string; slug: string; description: string; durationMinutes: number; price: number; bufferMinutes: number; isActive: boolean }>
): Promise<Service | null> {
  const columnMap: Record<string, string> = {
    name: "name",
    slug: "slug",
    description: "description",
    durationMinutes: "duration_minutes",
    price: "price",
    bufferMinutes: "buffer_minutes",
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

  if (fields.length === 0) return getServiceById(client, id);

  fields.push("updated_at = now()");
  values.push(id);

  const result = await client.query(
    `update services set ${fields.join(", ")} where id = $${i} returning *`,
    values
  );
  return result.rowCount ? mapRow(result.rows[0]) : null;
}

export async function deleteService(client: PoolClient, id: number): Promise<boolean> {
  const result = await client.query("delete from services where id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
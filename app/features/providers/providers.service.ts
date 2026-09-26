import { PoolClient } from "pg";
import { Provider } from "./providers.types";

function mapRow(row: { id: string; tenant_id: string; user_id: string | null; name: string; title: string | null; bio: string | null; avatar_url: string | null; is_active: boolean; slug: string; category: string; created_at: string; updated_at: string }): Provider {
  return {
    id: Number(row.id),
    tenantId: Number(row.tenant_id),
    userId: row.user_id,
    name: row.name,
    title: row.title,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    isActive: row.is_active,
    slug: row.slug,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProviders(client: PoolClient): Promise<Provider[]> {
  const result = await client.query("select * from providers order by created_at desc");
  return result.rows.map(mapRow);
}

export async function getProviderById(client: PoolClient, id: number): Promise<Provider | null> {
  const result = await client.query("select * from providers where id = $1", [id]);
  return result.rowCount ? mapRow(result.rows[0]) : null;
}

export async function createProvider(
  client: PoolClient,
  tenantId: number,
  data: { name: string; slug: string; category: string; title?: string; bio?: string; avatarUrl?: string; userId?: string }
): Promise<Provider> {
  const result = await client.query(
    `insert into providers (tenant_id, name, slug, category, title, bio, avatar_url, user_id)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning *`,
    [tenantId, data.name, data.slug, data.category, data.title ?? null, data.bio ?? null, data.avatarUrl ?? null, data.userId ?? null]
  );
  return mapRow(result.rows[0]);
}

export async function updateProvider(
  client: PoolClient,
  id: number,
  data: Partial<{ name: string; slug: string; category: string; title: string; bio: string; avatarUrl: string; userId: string; isActive: boolean }>
): Promise<Provider | null> {
  const columnMap: Record<string, string> = {
    name: "name",
    slug: "slug",
    category: "category",
    title: "title",
    bio: "bio",
    avatarUrl: "avatar_url",
    userId: "user_id",
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

  if (fields.length === 0) return getProviderById(client, id);

  fields.push("updated_at = now()");
  values.push(id);

  const result = await client.query(
    `update providers set ${fields.join(", ")} where id = $${i} returning *`,
    values
  );
  return result.rowCount ? mapRow(result.rows[0]) : null;
}

export async function deleteProvider(client: PoolClient, id: number): Promise<boolean> {
  const result = await client.query("delete from providers where id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function linkProviderToUser(
  client: PoolClient,
  providerId: number,
  userId: string
): Promise<Provider | null> {
  const result = await client.query(
    "update providers set user_id = $1 where id = $2 returning *",
    [userId, providerId]
  );
  return result.rowCount ? mapRow(result.rows[0]) : null;
}
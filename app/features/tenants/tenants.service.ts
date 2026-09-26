import { PoolClient } from "pg";

export type Tenant = {
  id: number;
  subdomain: string;
  name: string;
  isActive: boolean;
};

function mapTenant(row: { id: string; subdomain: string; name: string; is_active: boolean }): Tenant {
  return {
    id: Number(row.id),
    subdomain: row.subdomain,
    name: row.name,
    isActive: row.is_active,
  };
}

export async function getTenantBySubdomain(client: PoolClient, subdomain: string): Promise<Tenant | null> {
  const result = await client.query(
    "select id, subdomain, name, is_active from tenants where subdomain = $1 and is_active = true",
    [subdomain]
  );
  return result.rowCount ? mapTenant(result.rows[0]) : null;
}
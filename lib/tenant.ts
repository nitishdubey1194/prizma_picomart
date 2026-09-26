import { pool } from "./db";
import { AppError } from "./errors";

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
}

/**
 * Single-tenant for now: there is exactly one row in `tenants`.
 * When picomart supports multiple tenants, this should instead resolve
 * via the authenticated user's tenant_users membership.
 */
export async function getCurrentTenant(): Promise<Tenant> {
  const result = await pool.query("select id, name, subdomain from tenants limit 1");
  if (!result.rowCount) {
    throw new AppError(404, "Tenant not found.");
  }
  return result.rows[0] as Tenant;
}
import { AppError } from "./errors";
import { db } from "@/lib/db/index";
import { tenants } from "@/drizzle/schema";
import { sql, type ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

export interface Tenant {
  id: bigint | number;
  name: string;
  subdomain: string;
}

// 1. Properly extract the transaction client type with your schema models
type SchemaType = typeof import("@/lib/db");
export type DrizzleTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  SchemaType,
  ExtractTablesWithRelations<SchemaType>
>;

/**
 * Resolves current tenant via Drizzle.
 * Fetches the first tenant row for single-tenant mode or subdomain lookup.
 */
export async function getCurrentTenant(): Promise<Tenant> {
  try {
    const tenant = await db.query.tenants.findFirst({
      columns: {
        id: true,
        name: true,
        subdomain: true,
      },
    });

    // findFirst returns undefined when no record matches
    if (!tenant) {
      throw new AppError(404, "Tenant not foundss.");
    }

    return tenant;
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error("Database error in getCurrentTenant:", error);
    throw new AppError(500, "Failed to resolve tenant.");
  }
}

/**
 * Scopes database operations within an isolated transaction,
 * setting PostgreSQL session variables for RLS and procedure tracking.
 */
export async function withTenantContext<T>(
  tenantId: number | bigint,
  userId: string | null,
  callback: (tx: DrizzleTransaction) => Promise<T>
): Promise<T> {
  const tenantIdStr = tenantId.toString();

  return await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('request.tenant_id', ${tenantIdStr}, true)`
    );
    await tx.execute(
      sql`SELECT set_config('app.current_tenant_id', ${tenantIdStr}, true)`
    );

    if (userId) {
      await tx.execute(
        sql`SELECT set_config('app.current_user_id', ${userId}, true)`
      );
    }

    return await callback(tx as unknown as DrizzleTransaction);
  });
}
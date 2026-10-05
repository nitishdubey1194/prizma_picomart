import { AppError } from "./errors";
import { db } from "@/lib/db/index";
import { tenants } from "@/drizzle/schema";
import { headers } from "next/headers";
import { and, eq, sql, type ExtractTablesWithRelations } from "drizzle-orm";
import type { AnyPgColumn, AnyPgTable, PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

export interface Tenant {
  id: bigint | number;
  name: string;
  subdomain: string;
}

type SchemaType = typeof import("@/lib/db/index");
export type DrizzleTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  SchemaType,
  ExtractTablesWithRelations<SchemaType>
>;

type TenantTable = AnyPgTable & {
  id: AnyPgColumn;
  tenantId: AnyPgColumn;
};
type TenantSlugTable = TenantTable & { slug: AnyPgColumn };
type DefaultTenantTable = TenantTable & {
  isDefault: AnyPgColumn;
  updatedAt: AnyPgColumn;
};
type UserDefaultTenantTable = DefaultTenantTable & { userId: AnyPgColumn };

export async function getCurrentTenant(): Promise<Tenant> {
  try {
    const tenantSlug = (await headers()).get("x-tenant-slug")?.trim().toLowerCase();
    if (!tenantSlug) {
      throw new AppError(400, "Tenant slug header is required.");
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.subdomain, tenantSlug),
      columns: {
        id: true,
        name: true,
        subdomain: true,
      },
    });

    if (!tenant) {
      throw new AppError(404, "Tenant not found.");
    }

    return tenant;
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error("Database error in getCurrentTenant:", error);
    throw new AppError(500, "Failed to resolve tenant.");
  }
}

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

export async function unsetDefaultForTenantUser(
  tx: DrizzleTransaction,
  table: UserDefaultTenantTable,
  tenantId: number,
  userId: string
): Promise<void> {
  await tx
    .update(table)
    .set({ isDefault: false, updatedAt: sql`now()` })
    .where(and(eq(table.tenantId, tenantId), eq(table.userId, userId)));
}

export async function assertUniqueTenantSlug(
  tx: DrizzleTransaction,
  table: TenantSlugTable,
  tenantId: number,
  slug: string,
  excludeId?: number | bigint | string
): Promise<void> {
  const clauses = [eq(table.tenantId, tenantId), eq(table.slug, slug)];

  if (excludeId !== undefined) {
    clauses.push(sql`${table.id} != ${BigInt(excludeId)}`);
  }

  const [existing] = await tx
    .select({ id: table.id })
    .from(table)
    .where(and(...clauses))
    .limit(1);

  if (existing) {
    throw new AppError(409, "A record with this slug already exists.");
  }
}

export async function assertTenantRecordExists(
  tx: DrizzleTransaction,
  table: TenantTable,
  tenantId: number,
  recordId: number | bigint | string,
  message = "Record not found."
): Promise<void> {
  const [row] = await tx
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.id, Number(recordId)), eq(table.tenantId, tenantId)))
    .limit(1);

  if (!row) {
    throw new AppError(404, message);
  }
}

export async function unsetDefaultForTenant(
  tx: DrizzleTransaction,
  table: DefaultTenantTable,
  tenantId: number,
  excludeId?: number | bigint | string
): Promise<void> {
  const conditions = [eq(table.tenantId, tenantId)];

  if (excludeId !== undefined) {
    conditions.push(sql`${table.id} != ${BigInt(excludeId)}`);
  }

  await tx
    .update(table)
    .set({ isDefault: false, updatedAt: sql`now()` })
    .where(and(...conditions));
}
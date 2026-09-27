import { db } from "@/lib/db";
import { users, profiles, tenantUsers, providers, userRoles } from "@/drizzle/schema";
import { and, eq, or, ilike, sql } from "drizzle-orm";

export interface UserSearchResult {
  id: string;
  email: string;
  fullName: string | null;
  role: string | null;
}

export interface UserProfileDetails {
  id: string;
  email: string;
  fullName: string | null;
  role: string | null;
  roles: string[];
  createdAt: string | Date;
  providerId: number | null;
}

function toNumericId(value: number | bigint | string): number {
  return Number(value);
}

/**
 * Searches users within a specific tenant by email or full name for administrative operations.
 */
export async function searchUsers(
  tenantId: number | bigint | string,
  query: string,
  limit = 10
): Promise<UserSearchResult[]> {
  const pTenantId = toNumericId(tenantId);
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return [];
  }

  const cappedLimit = Math.min(Math.max(1, limit), 50);

  const rows = await db
    .select({
      id: users.id,
      email: sql<string>`${users.email}::text`,
      fullName: profiles.fullName,
      role: sql<string | null>`${userRoles.role}::text`,
    })
    .from(users)
    .innerJoin(tenantUsers, eq(tenantUsers.userId, users.id))
    .leftJoin(profiles, eq(profiles.id, users.id))
    .leftJoin(userRoles, eq(userRoles.userId, users.id))
    .where(
      and(
        eq(tenantUsers.tenantId, pTenantId),
        or(
          ilike(sql`${users.email}::text`, `%${cleanQuery}%`),
          ilike(profiles.fullName, `%${cleanQuery}%`)
        )
      )
    )
    .limit(cappedLimit);

  return rows;
}

/**
 * Fetches user profile along with linked provider profile and roles.
 */
export async function getUserProfileById(
  userId: string,
  tenantId?: number | bigint | string
): Promise<UserProfileDetails | null> {
  const pTenantId = tenantId !== undefined ? toNumericId(tenantId) : undefined;

  // 1. Fetch user base info and provider mapping
  const [baseRow] = await db
    .select({
      id: users.id,
      email: sql<string>`${users.email}::text`,
      fullName: profiles.fullName,
      createdAt: users.createdAt,
      providerId: providers.id,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.id, users.id))
    .leftJoin(
      providers,
      and(
        eq(providers.userId, users.id),
        pTenantId !== undefined ? eq(providers.tenantId, pTenantId) : undefined
      )
    )
    .where(eq(users.id, userId))
    .limit(1);

  if (!baseRow) {
    return null;
  }

  // 2. Query user_roles strictly by user_id
  const roleRows = await db
    .select({
      role: sql<string>`${userRoles.role}::text`,
    })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  const roleSet = new Set<string>(roleRows.map((r) => r.role));

  // 3. If a provider profile exists for this tenant, add 'provider' to the active roles
  if (baseRow.providerId != null) {
    roleSet.add("provider");
  }

  const roles = Array.from(roleSet);
  const primaryRole = roles[0] ?? null;

  return {
    id: baseRow.id,
    email: baseRow.email,
    fullName: baseRow.fullName,
    role: primaryRole,
    roles,
    createdAt: baseRow.createdAt,
    providerId: baseRow.providerId != null ? Number(baseRow.providerId) : null,
  };
}
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rolePermissions, tenantUsers } from "@/drizzle/schema";
import { AppError } from "@/lib/errors";
import { and, eq } from "drizzle-orm";
import { AuthenticatedUser, AppRole } from "./auth.types";
import { getAuthUser } from "./auth.utils";

export type PermissionName =
  | "dashboard.view"
  | "user.view"
  | "user.block"
  | "user.verify"
  | "seller.view"
  | "seller.approve"
  | "seller.block"
  | "category.view"
  | "category.create"
  | "category.update"
  | "category.delete"
  | "product.view"
  | "product.create"
  | "product.update"
  | "product.delete"
  | "product.approve"
  | "product.view_own"
  | "product.update_own"
  | "product.delete_own"
  | "inventory.view"
  | "inventory.update"
  | "cart.add"
  | "cart.update"
  | "cart.remove"
  | "order.view_all"
  | "order.update_status"
  | "order.cancel"
  | "order.refund"
  | "order.view_own"
  | "order.update_status_own"
  | "order.create"
  | "order.cancel_own"
  | "payment.create"
  | "payment.view"
  | "payment.view_own"
  | "profile.view"
  | "profile.update"
  | "address.manage"
  | "report.sales"
  | "report.orders"
  | "report.users"
  | "payout.view"
  | "booking.view_all"
  | "booking.manage"
  | "booking.view_own"
  | "booking.cancel_own"
  | "booking.create";

export type AuthenticatedRouteHandler = (
  request: NextRequest,
  context: { user: AuthenticatedUser }
) => Promise<NextResponse>;

/**
 * Higher-order wrapper requiring a valid access token.
 */
export function requireAuth(handler: AuthenticatedRouteHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = await getAuthUser(request);
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return await handler(request, { user });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      const message = error instanceof Error ? error.message : "Authentication error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

/**
 * Higher-order wrapper requiring specific role membership (e.g. ['admin', 'super_admin']).
 */
export function requireRole(allowedRoles: AppRole[], handler: AuthenticatedRouteHandler) {
  return requireAuth(async (request: NextRequest, { user }: { user: AuthenticatedUser }) => {
    if (!user.role || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to access this resource" },
        { status: 403 }
      );
    }

    return await handler(request, { user });
  });
}

/**
 * Checks whether an authenticated user possesses an explicit permission under the active tenant.
 */
export async function hasPermission(
  tenantId: number,
  userId: string,
  permission: PermissionName
): Promise<boolean> {
  // 1. Fetch user's role in this tenant[cite: 1]
  const [membership] = await db
    .select({
      role: tenantUsers.role,
      isActive: tenantUsers.isActive,
    })
    .from(tenantUsers)
    .where(
      and(
        eq(tenantUsers.tenantId, tenantId),
        eq(tenantUsers.userId, userId),
        eq(tenantUsers.isActive, true)
      )
    )
    .limit(1);

  if (!membership) {
    return false;
  }

  // Super admins bypass individual permission checks[cite: 1]
  if (membership.role === "super_admin") {
    return true;
  }

  // 2. Query role_permissions junction table[cite: 1]
  const [granted] = await db
    .select({ id: rolePermissions.id })
    .from(rolePermissions)
    .where(
      and(
        eq(rolePermissions.role, membership.role),
        eq(rolePermissions.permission, permission)
      )
    )
    .limit(1);

  return Boolean(granted);
}

/**
 * Higher-order wrapper verifying granular permission for the active tenant.
 */
export function requirePermission(permission: PermissionName, handler: AuthenticatedRouteHandler) {
  return requireAuth(async (request: NextRequest, { user }: { user: AuthenticatedUser }) => {
    if (!user.tenantId) {
      return NextResponse.json({ error: "Tenant context is missing" }, { status: 400 });
    }

    const permitted = await hasPermission(user.tenantId, user.id, permission);
    if (!permitted) {
      return NextResponse.json(
        { error: `Forbidden: Missing required permission '${permission}'` },
        { status: 403 }
      );
    }

    return await handler(request, { user });
  });
}
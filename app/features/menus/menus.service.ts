import { db } from "@/lib/db";
import { menus } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, sql, asc } from "drizzle-orm";

export type MenuType = "header" | "footer_1" | "footer_2" | "footer_3" | "footer_4";

export interface CreateMenuItemInput {
  menuType: MenuType;
  parentId?: number | bigint | string | null;
  title: string;
  href?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateMenuItemInput {
  menuType?: MenuType;
  parentId?: number | bigint | string | null;
  title?: string;
  href?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface MenuItemTree {
  id: string;
  tenantId: number;
  menuType: MenuType;
  parentId: number | null;
  title: string;
  href: string | null;
  icon: string | null;
  sortOrder: number | null;
  isActive: boolean | null;
  createdAt: string | null;
  children: MenuItemTree[];
}

/**
 * Lists menu items grouped into a hierarchical parent-child tree for a specific channel (e.g. 'header', 'footer_1').
 */
export async function getTenantNavigationTree(
  tenantId: number | bigint,
  menuType?: MenuType
): Promise<MenuItemTree[]> {
  const pTenantId = Number(tenantId);
  const conditions = [
    eq(menus.tenantId, pTenantId),
    eq(menus.isActive, true),
  ];

  if (menuType) {
    conditions.push(eq(menus.menuType, menuType));
  }

  const rows = await db
    .select()
    .from(menus)
    .where(and(...conditions))
    .orderBy(asc(menus.sortOrder), asc(menus.createdAt));

  const items: MenuItemTree[] = rows.map((r) => ({
    id: r.id.toString(),
    tenantId: r.tenantId,
    menuType: r.menuType,
    parentId: r.parentId,
    title: r.title,
    href: r.href,
    icon: r.icon,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
    createdAt: r.createdAt,
    children: [],
  }));

  // Build recursive tree structure
  const itemMap = new Map<number, MenuItemTree>();
  items.forEach((item) => itemMap.set(Number(item.id), item));

  const rootItems: MenuItemTree[] = [];

  for (const item of items) {
    if (item.parentId && itemMap.has(item.parentId)) {
      itemMap.get(item.parentId)!.children.push(item);
    } else {
      rootItems.push(item);
    }
  }

  return rootItems;
}

/**
 * Creates a navigation menu item within tenant context.
 */
export async function createMenuItem(
  tenantId: number | bigint,
  userId: string,
  input: CreateMenuItemInput
) {
  const pTenantId = Number(tenantId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // 1. Verify parent item exists and belongs to the same tenant if provided[cite: 1]
    if (input.parentId) {
      const [parent] = await tx
        .select({ id: menus.id })
        .from(menus)
        .where(
          and(
            eq(menus.id, Number(input.parentId)),
            eq(menus.tenantId, pTenantId)
          )
        )
        .limit(1);

      if (!parent) {
        throw new AppError(404, "Parent menu item not found for this tenant.");
      }
    }

    // 2. Insert item[cite: 1]
    const [newItem] = await tx
      .insert(menus)
      .values({
        tenantId: pTenantId,
        menuType: input.menuType,
        parentId: input.parentId != null ? Number(input.parentId) : null,
        title: input.title,
        href: input.href ?? null,
        icon: input.icon ?? null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
      })
      .returning();

    return {
      ...newItem,
      id: newItem.id.toString(),
    };
  });
}

/**
 * Updates a navigation menu item.
 */
export async function updateMenuItem(
  tenantId: number | bigint,
  userId: string,
  itemId: number | bigint | string,
  input: UpdateMenuItemInput
) {
  const pTenantId = Number(tenantId);
  const pItemIdBigInt = Number(itemId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // Prevent setting self as parent[cite: 1]
    if (input.parentId != null && Number(input.parentId) === pItemIdBigInt) {
      throw new AppError(400, "A menu item cannot be its own parent.");
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (input.menuType !== undefined) updatePayload.menuType = input.menuType;
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.href !== undefined) updatePayload.href = input.href;
    if (input.icon !== undefined) updatePayload.icon = input.icon;
    if (input.sortOrder !== undefined) updatePayload.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) updatePayload.isActive = input.isActive;
    if (input.parentId !== undefined) {
      updatePayload.parentId = input.parentId != null ? Number(input.parentId) : null;
    }

    const [updated] = await tx
      .update(menus)
      .set(updatePayload)
      .where(
        and(
          eq(menus.id, pItemIdBigInt),
          eq(menus.tenantId, pTenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Menu item not found.");
    }

    return {
      ...updated,
      id: updated.id.toString(),
    };
  });
}

/**
 * Deletes a menu item and any cascading children.
 */
export async function deleteMenuItem(
  tenantId: number | bigint,
  userId: string,
  itemId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pItemIdBigInt = Number(itemId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const deleted = await tx
      .delete(menus)
      .where(
        and(
          eq(menus.id, pItemIdBigInt),
          eq(menus.tenantId, pTenantId)
        )
      )
      .returning({ id: menus.id });

    if (!deleted.length) {
      throw new AppError(404, "Menu item not found.");
    }

    return { success: true };
  });
}
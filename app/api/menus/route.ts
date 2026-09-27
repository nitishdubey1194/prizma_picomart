import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getTenantNavigationTree,
  createMenuItem,
  type CreateMenuItemInput,
  type MenuType,
} from "@/app/features/menus/menus.service";
import { AppError } from "@/lib/errors";

const VALID_MENU_TYPES: MenuType[] = [
  "header",
  "footer_1",
  "footer_2",
  "footer_3",
  "footer_4",
];

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type") as MenuType | null;

    const menuType =
      typeParam && VALID_MENU_TYPES.includes(typeParam) ? typeParam : undefined;

    const tenant = await getCurrentTenant();
    const tree = await getTenantNavigationTree(tenant.id, menuType);

    return NextResponse.json({ menus: tree }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load menus";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateMenuItemInput;

    if (!body?.title || !body?.menuType || !VALID_MENU_TYPES.includes(body.menuType)) {
      return NextResponse.json(
        {
          error: `Fields 'title' and a valid 'menuType' (${VALID_MENU_TYPES.join(", ")}) are required`,
        },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const item = await createMenuItem(tenant.id, user.id, body);

    return NextResponse.json({ menuItem: item }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create menu item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
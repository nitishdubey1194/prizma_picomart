import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  updateCartItemQuantity,
  removeCartItem,
} from "@/app/features/cart/cart.service";
import { AppError } from "@/lib/errors";

type RouteParams = RouteContext<"/api/cart/[id]">;

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cartItemId = Number(id);

    if (!cartItemId) {
      return NextResponse.json(
        { error: "A valid cart item ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    if (typeof body?.quantity !== "number") {
      return NextResponse.json(
        { error: "Field 'quantity' must be a valid number" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const item = await updateCartItemQuantity(tenant.id, user.id, cartItemId, {
      quantity: body.quantity,
    });

    return NextResponse.json({ cartItem: item }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to update cart item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cartItemId = Number(id);

    if (!cartItemId) {
      return NextResponse.json(
        { error: "A valid cart item ID is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const result = await removeCartItem(tenant.id, user.id, cartItemId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to delete cart item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
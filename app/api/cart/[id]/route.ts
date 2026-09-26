import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { updateCartItemSchema } from "@/app/features/cart/cart.schema";
import { updateCartItemQuantity, removeCartItem } from "@/app/features/cart/cart.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const body = await req.json();
    const data = updateCartItemSchema.parse(body);
    const updated = await withUserContext(user.id, (client) => updateCartItemQuantity(client, Number(id), data.quantity));
    if (!updated) throw new AppError(404, "Cart item not found.");
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const deleted = await withUserContext(user.id, (client) => removeCartItem(client, Number(id)));
    if (!deleted) throw new AppError(404, "Cart item not found.");
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
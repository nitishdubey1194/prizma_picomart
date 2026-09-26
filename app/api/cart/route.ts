import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { getCurrentTenant } from "@/lib/tenant";
import { addToCartSchema } from "@/app/features/cart/cart.schema";
import { listCartItems, addToCart, clearCart } from "@/app/features/cart/cart.service";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const items = await withUserContext(user.id, (client) => listCartItems(client, user.id));
    return NextResponse.json(items, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const body = await req.json();
    const data = addToCartSchema.parse(body);
    const tenant = await getCurrentTenant();
    await withUserContext(user.id, (client) => addToCart(client, tenant.id, user.id, data.variantId, data.quantity));
    const items = await withUserContext(user.id, (client) => listCartItems(client, user.id));
    return NextResponse.json(items, { status: 201 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    await withUserContext(user.id, (client) => clearCart(client, user.id));
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
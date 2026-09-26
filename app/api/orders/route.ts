import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { listOrders } from "@/app/features/orders/orders.service";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const orders = await withUserContext(user.id, (client) => listOrders(client));
    return NextResponse.json(orders, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
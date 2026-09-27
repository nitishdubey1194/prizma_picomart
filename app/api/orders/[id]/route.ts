import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import { getOrderById } from "@/app/features/orders/orders.service";
import { AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(_request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = Number(id);

    if (!orderId) {
      return NextResponse.json(
        { error: "A valid order ID is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const order = await getOrderById(tenant.id, user.id, orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Convert BigInt identifiers for JSON serialization
    const serializedOrder = {
      ...order,
      id: order.id.toString(),
      items: order.items.map((item) => ({
        ...item,
        id: item.id.toString(),
      })),
    };

    return NextResponse.json({ order: serializedOrder }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch order details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
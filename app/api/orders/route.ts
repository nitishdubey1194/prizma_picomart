import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getUserOrders,
  createOrderFromCart,
  type CreateOrderInput,
} from "@/app/features/orders/orders.service";
import { AppError } from "@/lib/errors";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await getCurrentTenant();
    const ordersList = await getUserOrders(tenant.id, user.id);

    return NextResponse.json({ orders: ordersList }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateOrderInput;

    if (!body?.addressId) {
      return NextResponse.json(
        { error: "Field 'addressId' is required" },
        { status: 400 }
      );
    }

    if (!body?.paymentMethod) {
      return NextResponse.json(
        { error: "Field 'paymentMethod' is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const order = await createOrderFromCart(tenant.id, user.id, body);

    // Convert BigInt id to string for JSON serialization
    return NextResponse.json(
      {
        order: {
          id: order.orderId.toString(),
          orderNumber: order.orderNumber,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to process order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
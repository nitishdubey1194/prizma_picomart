import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import { createOrderFromCart } from "@/app/features/orders/orders.service";
import { AppError } from "@/lib/errors";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

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
    const result = await createOrderFromCart(tenant.id, user.id, {
      addressId: body.addressId,
      storeId: body.storeId ?? null,
      paymentMethod: body.paymentMethod,
      deliveryType: body.deliveryType ?? "delivery",
      deliveryNotes: body.deliveryNotes ?? null,
    });

    return NextResponse.json(
      {
        order: {
          id: result.orderId.toString(),
          orderNumber: result.orderNumber,
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
      error instanceof Error ? error.message : "Checkout processing failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
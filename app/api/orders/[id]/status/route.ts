import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  updateOrderStatus,
  type UpdateOrderStatusInput,
} from "@/app/features/orders/orders.service";
import { AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ALLOWED_STATUSES: UpdateOrderStatusInput["status"][] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "failed",
  "out_for_delivery",
];

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
    const orderId = Number(id);

    if (!orderId) {
      return NextResponse.json(
        { error: "A valid order ID is required" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as UpdateOrderStatusInput;

    if (!body?.status || !ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();

    const result = await updateOrderStatus(
      tenant.id,
      user.id,
      orderId,
      body
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to update order status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
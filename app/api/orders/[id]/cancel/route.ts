import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import { updateOrderStatus } from "@/app/features/orders/orders.service";
import { AppError } from "@/lib/errors";

type RouteParams = RouteContext<"/api/orders/[id]/cancel">;

export async function POST(
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

    let remarks = "Order cancelled by customer.";
    try {
      const body = await request.json();
      if (body?.remarks) remarks = body.remarks;
    } catch {
      // Body is optional
    }

    const tenant = await getCurrentTenant();

    const result = await updateOrderStatus(tenant.id, user.id, orderId, {
      status: "cancelled",
      remarks,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to cancel order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
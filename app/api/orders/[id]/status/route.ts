import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { updateOrderStatusSchema } from "@/app/features/orders/order-status.schema";
import { updateOrderStatus } from "@/app/features/orders/orders.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const body = await req.json();
    const data = updateOrderStatusSchema.parse(body);
    const order = await withUserContext(user.id, (client) =>
      updateOrderStatus(client, Number(id), data.status, data.remarks)
    );
    if (!order) throw new AppError(404, "Order not found or you don't have permission to update it.");
    return NextResponse.json(order, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
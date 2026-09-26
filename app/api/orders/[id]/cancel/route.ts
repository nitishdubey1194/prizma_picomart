import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { cancelOrderSchema } from "@/app/features/orders/orders.schema";
import { cancelOrder } from "@/app/features/orders/orders.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const data = cancelOrderSchema.parse(body);
    await withUserContext(user.id, (client) => cancelOrder(client, Number(id), data.reason));
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
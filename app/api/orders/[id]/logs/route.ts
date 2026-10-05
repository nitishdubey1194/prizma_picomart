import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/index";
import { orderStatusLogs } from "@/drizzle/schema";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import { AppError } from "@/lib/errors";
import { and, eq, desc } from "drizzle-orm";

type RouteParams = RouteContext<"/api/orders/[id]/logs">;

export async function GET(
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

    const tenant = await getCurrentTenant();

    const logs = await db
      .select({
        id: orderStatusLogs.id,
        orderId: orderStatusLogs.orderId,
        status: orderStatusLogs.status,
        remarks: orderStatusLogs.remarks,
        createdAt: orderStatusLogs.createdAt,
      })
      .from(orderStatusLogs)
      .where(
        and(
          eq(orderStatusLogs.orderId, orderId),
          eq(orderStatusLogs.tenantId, Number(tenant.id))
        )
      )
      .orderBy(desc(orderStatusLogs.createdAt));

    // Convert bigserial IDs for serialization
    const serializedLogs = logs.map((log) => ({
      ...log,
      id: log.id.toString(),
    }));

    return NextResponse.json({ logs: serializedLogs }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to fetch order history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
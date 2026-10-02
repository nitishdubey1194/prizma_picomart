import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import { cancelAppointment } from "@/app/features/appointments/appointments.service";
import { AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
    const appointmentId = Number(id);

    if (!appointmentId) {
      return NextResponse.json(
        { error: "A valid appointment ID is required" },
        { status: 400 }
      );
    }

    let reason: string | undefined;
    try {
      const body = await request.json();
      if (body?.reason) reason = body.reason;
    } catch {
      // Reason body optional
    }

    const tenant = await getCurrentTenant();
    const result = await cancelAppointment(tenant.id, user.id, appointmentId, reason);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to cancel appointment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
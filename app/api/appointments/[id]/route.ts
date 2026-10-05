import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import { getAppointmentById } from "@/app/features/appointments/appointments.service";
import { AppError } from "@/lib/errors";

type RouteParams = RouteContext<"/api/appointments/[id]">;

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
    const appointmentId = Number(id);

    if (!appointmentId) {
      return NextResponse.json(
        { error: "A valid appointment ID is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const appointment = await getAppointmentById(tenant.id, user.id, appointmentId);

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ appointment }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load appointment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
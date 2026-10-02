import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  updateAppointmentStatus,
  type UpdateAppointmentStatusInput,
  type BookingStatusType,
} from "@/app/features/appointments/appointments.service";
import { AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES: BookingStatusType[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
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
    const appointmentId = Number(id);

    if (!appointmentId) {
      return NextResponse.json(
        { error: "A valid appointment ID is required" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as UpdateAppointmentStatusInput;

    if (!body?.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const updated = await updateAppointmentStatus(
      tenant.id,
      user.id,
      appointmentId,
      body
    );

    return NextResponse.json({ appointment: updated }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to update appointment status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
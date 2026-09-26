import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { updateStatusSchema } from "@/app/features/appointments/appointments.schema";
import { updateAppointmentStatus } from "@/app/features/appointments/appointments.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const body = await req.json();
    const data = updateStatusSchema.parse(body);
    console.log(data);
    const appointment = await withUserContext(user.id, (client) =>
      updateAppointmentStatus(client, Number(id), data.status, user.id)
    );
    if (!appointment) throw new AppError(404, "Appointment not found or you don't have permission to update it.");
    return NextResponse.json(appointment, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
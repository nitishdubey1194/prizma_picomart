import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { getCurrentTenant } from "@/lib/tenant";
import { createAppointmentSchema } from "@/app/features/appointments/appointments.schema";
import { bookAppointment, listAppointmentsWithDetails } from "@/app/features/appointments/appointments.service";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const appointments = await withUserContext(user.id, (client) => listAppointmentsWithDetails(client));
    return NextResponse.json(appointments, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const body = await req.json();
    const data = createAppointmentSchema.parse(body);
    const tenant = await getCurrentTenant();
    const appointment = await withUserContext(user.id, (client) => bookAppointment(client, tenant.id, data));
    return NextResponse.json(appointment, { status: 201 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
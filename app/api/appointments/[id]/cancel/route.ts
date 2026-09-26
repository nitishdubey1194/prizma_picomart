import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { cancelAppointmentSchema } from "@/app/features/appointments/appointments.schema";
import { cancelAppointment } from "@/app/features/appointments/appointments.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const data = cancelAppointmentSchema.parse(body);
    await withUserContext(user.id, (client) => cancelAppointment(client, Number(id), data.reason));
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
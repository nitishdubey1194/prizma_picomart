import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getAppointments,
  createAppointment,
  type CreateAppointmentInput,
  type BookingStatusType,
} from "@/app/features/appointments/appointments.service";
import { AppError } from "@/lib/errors";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId") ?? undefined;
    const status = (searchParams.get("status") as BookingStatusType) ?? undefined;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;

    const list = await getAppointments(tenant.id, user.id, {
      providerId,
      status,
      startDate,
      endDate,
    });

    return NextResponse.json({ appointments: list }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch appointments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await getCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const rawBody: unknown = await request.json();
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const body = rawBody as Partial<CreateAppointmentInput>;

    if (
      !body?.providerId ||
      !body?.serviceId ||
      !body?.startTime ||
      !body?.endTime ||
      !body?.localDate
    ) {
      return NextResponse.json(
        { error: "providerId, serviceId, startTime, endTime, and localDate are required" },
        { status: 400 }
      );
    }

    const appointment = await createAppointment(
      tenant.id,
      user.id,
      body as CreateAppointmentInput
    );

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Appointment booking failed:", error);
    return NextResponse.json({ error: "Failed to book appointment." }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { getAvailableSlots } from "@/app/features/availability/availability.service";
import { getServiceById } from "@/app/features/services/services.service"; // adjust to your actual export name

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const date = req.nextUrl.searchParams.get("date");
    const serviceIdParam = req.nextUrl.searchParams.get("serviceId");

    if (!date || !serviceIdParam) {
      return NextResponse.json({ message: "date and serviceId are required" }, { status: 400 });
    }

    const user = getOptionalAuthUser(req);

    const service = await withUserContext(user?.id ?? null, (client) =>
      getServiceById(client, Number(serviceIdParam))
    );
    if (!service) {
      return NextResponse.json({ message: "Service not found" }, { status: 404 });
    }

    const slots = await withUserContext(user?.id ?? null, (client) =>
      getAvailableSlots(client, Number(id), date, service.durationMinutes)
    );

    return NextResponse.json(slots, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
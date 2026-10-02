import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { generateAvailableSlots } from "@/app/features/availability/generate-slots";
import { AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const providerId = Number(id);

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!providerId || !serviceId || !date) {
      return NextResponse.json(
        { error: "Parameters 'serviceId' and 'date' (YYYY-MM-DD) are required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();

    const slots = await generateAvailableSlots({
      tenantId: tenant.id,
      providerId,
      serviceId: Number(serviceId),
      date,
    });

    return NextResponse.json({ slots }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to calculate slots";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
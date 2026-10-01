// app/api/providers/[id]/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import { getCurrentTenant } from "@/lib/tenant";
import { upsertProviderService } from "@/app/features/providers/provider-services.service";
import { AppError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const providerId = Number(id);
    const tenant = await getCurrentTenant();
    const body = await req.json();

    const result = await upsertProviderService(tenant.id, user.id, providerId, {
      serviceId: Number(body.serviceId),
      priceOverride: body.priceOverride !== undefined && body.priceOverride !== null ? String(body.priceOverride) : null,
      durationOverrideMinutes: body.durationOverrideMinutes ? Number(body.durationOverrideMinutes) : null,
      isActive: body.isActive ?? true,
    });

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to map service" }, { status: 500 });
  }
}
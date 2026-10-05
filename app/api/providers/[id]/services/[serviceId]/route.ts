import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  updateProviderService,
  removeServiceFromProvider,
  type UpdateProviderServiceInput,
} from "@/app/features/providers/provider-services.service";
import { AppError } from "@/lib/errors";

type RouteParams = RouteContext<"/api/providers/[id]/services/[serviceId]">;

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, serviceId } = await params;
    const providerId = Number(id);
    const parsedServiceId = Number(serviceId);

    if (!providerId || !parsedServiceId) {
      return NextResponse.json(
        { error: "Valid provider ID and service ID are required" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as UpdateProviderServiceInput;
    const tenant = await getCurrentTenant();

    const updated = await updateProviderService(
      tenant.id,
      user.id,
      providerId,
      parsedServiceId,
      body
    );

    return NextResponse.json({ providerService: updated }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to update service mapping";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, serviceId } = await params;
    const providerId = Number(id);
    const parsedServiceId = Number(serviceId);

    if (!providerId || !parsedServiceId) {
      return NextResponse.json(
        { error: "Valid provider ID and service ID are required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const result = await removeServiceFromProvider(
      tenant.id,
      user.id,
      providerId,
      parsedServiceId
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to remove service mapping";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
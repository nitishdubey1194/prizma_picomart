import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getServiceById,
  updateService,
  deleteService,
  type UpdateServiceInput,
} from "@/app/features/services/services.service";
import { AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const serviceId = Number(id);

    if (!serviceId) {
      return NextResponse.json(
        { error: "A valid service ID is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const service = await getServiceById(tenant.id, serviceId);

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch service";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const serviceId = Number(id);

    if (!serviceId) {
      return NextResponse.json(
        { error: "A valid service ID is required" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as UpdateServiceInput;
    const tenant = await getCurrentTenant();

    const updated = await updateService(tenant.id, user.id, serviceId, body);

    return NextResponse.json({ service: updated }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to update service";
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

    const { id } = await params;
    const serviceId = Number(id);

    if (!serviceId) {
      return NextResponse.json(
        { error: "A valid service ID is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const result = await deleteService(tenant.id, user.id, serviceId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to delete service";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
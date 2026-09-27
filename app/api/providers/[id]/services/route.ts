import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getProviderServices,
  assignServiceToProvider,
  type AssignServiceToProviderInput,
} from "@/app/features/providers/provider-services.service";
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
    const providerId = Number(id);

    if (!providerId) {
      return NextResponse.json(
        { error: "A valid provider ID is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const list = await getProviderServices(tenant.id, providerId);

    return NextResponse.json({ services: list }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load provider services";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const providerId = Number(id);

    if (!providerId) {
      return NextResponse.json(
        { error: "A valid provider ID is required" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as AssignServiceToProviderInput;

    if (!body?.serviceId) {
      return NextResponse.json(
        { error: "Field 'serviceId' is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const mapping = await assignServiceToProvider(
      tenant.id,
      user.id,
      providerId,
      body
    );

    return NextResponse.json({ providerService: mapping }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to assign service";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
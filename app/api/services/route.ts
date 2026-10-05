import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getTenantServices,
  createService,
  type CreateServiceInput,
} from "@/app/features/services/services.service";
import { AppError } from "@/lib/errors";

export async function GET(): Promise<NextResponse> {
  try {
    const tenant = await getCurrentTenant();
    const list = await getTenantServices(tenant.id);

    return NextResponse.json({ services: list }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch services";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateServiceInput;

    if (!body?.name || !body?.slug || body?.durationMinutes == null || body?.price == null) {
      return NextResponse.json(
        { error: "Fields 'name', 'slug', 'durationMinutes', and 'price' are required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const service = await createService(tenant.id, user.id, body);

    return NextResponse.json({ service }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create service";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
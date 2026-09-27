import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  createTenant,
  getTenantById,
  type CreateTenantInput,
} from "@/app/features/tenants/tenants.service";
import { AppError } from "@/lib/errors";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const tenant = await getCurrentTenant();
    const details = await getTenantById(tenant.id);

    if (!details) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ tenant: details }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load tenant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateTenantInput;

    if (!body?.name || !body?.subdomain || !body?.planId) {
      return NextResponse.json(
        { error: "Fields 'name', 'subdomain', and 'planId' are required" },
        { status: 400 }
      );
    }

    const tenant = await createTenant(user.id, body);

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create tenant";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
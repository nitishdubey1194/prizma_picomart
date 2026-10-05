import { NextRequest, NextResponse } from "next/server";
import { getTenantBySubdomain } from "@/app/features/tenants/tenants.service";
import { AppError } from "@/lib/errors";

type RouteParams = RouteContext<"/api/tenants/[subdomain]">;

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { subdomain } = await params;

    if (!subdomain?.trim()) {
      return NextResponse.json(
        { error: "Subdomain parameter is required" },
        { status: 400 }
      );
    }

    const tenant = await getTenantBySubdomain(subdomain);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found or inactive" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          planId: tenant.planId,
          themeId: tenant.themeId,
          isActive: tenant.isActive,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
        },
        theme: tenant.theme ?? null,
        plan: tenant.plan ?? null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to resolve tenant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
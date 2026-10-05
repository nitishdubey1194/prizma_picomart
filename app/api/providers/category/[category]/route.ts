// app/api/providers/category/[category]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getProvidersByCategory } from "@/app/features/providers/providers.service";
import { AppError } from "@/lib/errors";

type RouteParams = RouteContext<"/api/providers/category/[category]">;

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { category } = await params;
    const tenant = await getCurrentTenant();

    const providerList = await getProvidersByCategory(Number(tenant.id), category);

    return NextResponse.json(
      { success: true, data: providerList },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    console.error("Failed to fetch category providers:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
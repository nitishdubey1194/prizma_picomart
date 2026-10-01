import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getTenantProviders,
  getProvidersByService,
  getProvidersByCategory,
  createProvider,
  type CreateProviderInput,
} from "@/app/features/providers/providers.service";
import { AppError } from "@/lib/errors";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new AppError(400, "Tenant not found");
    }

    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const category = searchParams.get("category");

    let providers;

    if (category) {
      console.log('1');
      providers = await getProvidersByCategory(tenant.id, category);
    } else if (serviceId != 'all' && serviceId) {
      console.log('2');
      providers = await getProvidersByService(tenant.id, Number(serviceId));
    } else {
      console.log('3');
      providers = await getTenantProviders(tenant.id);
    }

    return NextResponse.json({ providers }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status:  400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateProviderInput;

    if (!body?.name || !body?.slug || !body?.category) {
      return NextResponse.json(
        { error: "Fields 'name', 'slug', and 'category' are required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    if (!tenant) {
      throw new AppError(400, "Tenant not found");
    }

    const provider = await createProvider(tenant.id, user.id, body);

    return NextResponse.json({ provider }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status:  400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create provider";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
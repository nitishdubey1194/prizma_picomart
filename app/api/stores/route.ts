import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getTenantStores,
  createStore,
  type CreateStoreInput,
} from "@/app/features/stores/stores.service";
import { AppError } from "@/lib/errors";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const tenant = await getCurrentTenant();
    const storesList = await getTenantStores(tenant.id);

    return NextResponse.json({ stores: storesList }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load stores";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateStoreInput;

    if (!body?.name || !body?.addressLine1) {
      return NextResponse.json(
        { error: "Fields 'name' and 'addressLine1' are required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const store = await createStore(tenant.id, user.id, body);

    return NextResponse.json({ store }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create store";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
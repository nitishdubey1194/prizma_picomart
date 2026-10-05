import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getStoreById,
  updateStore,
  deleteStore,
  type UpdateStoreInput,
} from "@/app/features/stores/stores.service";
import { AppError } from "@/lib/errors";

type RouteParams = RouteContext<"/api/stores/[id]">;

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const tenant = await getCurrentTenant();
    const store = await getStoreById(tenant.id, id);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ store }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch store";
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
    const body = (await request.json()) as UpdateStoreInput;
    const tenant = await getCurrentTenant();

    const updated = await updateStore(tenant.id, user.id, id, body);

    return NextResponse.json({ store: updated }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to update store";
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
    const tenant = await getCurrentTenant();

    const result = await deleteStore(tenant.id, user.id, id);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to delete store";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
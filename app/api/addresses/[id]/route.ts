import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  updateUserAddress,
  deleteUserAddress,
  type UpdateAddressInput,
} from "@/app/features/addresses/addresses.service";
import { AppError } from "@/lib/errors";

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/addresses/[id]">
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateAddressInput;
    const tenant = await getCurrentTenant();

    const updated = await updateUserAddress(tenant.id, user.id, id, body);

    return NextResponse.json(
      {
        address: {
          ...updated,
          id: updated.id.toString(),
        },
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
      error instanceof Error ? error.message : "Failed to update address";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/addresses/[id]">
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tenant = await getCurrentTenant();

    const result = await deleteUserAddress(tenant.id, user.id, id);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to delete address";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
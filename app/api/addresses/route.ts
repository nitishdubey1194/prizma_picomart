import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getUserAddresses,
  createUserAddress,
  type CreateAddressInput,
} from "@/app/features/addresses/addresses.service";
import { AppError } from "@/lib/errors";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await getCurrentTenant();
    const addresses = await getUserAddresses(tenant.id, user.id);

    // Serialize bigint IDs to string
    const serializedAddresses = addresses.map((addr) => ({
      ...addr,
      id: addr.id.toString(),
    }));

    return NextResponse.json({ addresses: serializedAddresses }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch addresses";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateAddressInput;

    if (!body?.addressLine1 || !body?.city || !body?.state || !body?.pincode) {
      return NextResponse.json(
        { error: "addressLine1, city, state, and pincode are required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const address = await createUserAddress(tenant.id, user.id, body);

    return NextResponse.json(
      {
        address: {
          ...address,
          id: address.id.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create address";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
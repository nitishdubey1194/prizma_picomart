import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { getCurrentTenant } from "@/lib/tenant";
import { createAddressSchema } from "@/app/features/addresses/addresses.schema";
import { listAddresses, createAddress } from "@/app/features/addresses/addresses.service";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const addresses = await withUserContext(user.id, (client) => listAddresses(client, user.id));
    return NextResponse.json(addresses, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const body = await req.json();
    const data = createAddressSchema.parse(body);
    const tenant = await getCurrentTenant();
    const address = await withUserContext(user.id, (client) => createAddress(client, tenant.id, user.id, data));
    return NextResponse.json(address, { status: 201 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
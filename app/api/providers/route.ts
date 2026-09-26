import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser, getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { getCurrentTenant } from "@/lib/tenant";
import { createProviderSchema } from "@/app/features/providers/providers.schema";
import { listProviders, createProvider } from "@/app/features/providers/providers.service";

export async function GET(req: NextRequest) {
  try {
    const user = getOptionalAuthUser(req);
    const providers = await withUserContext(user?.id ?? null, (client) => listProviders(client));
    return NextResponse.json(providers, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const body = await req.json();
    const data = createProviderSchema.parse(body);
    const tenant = await getCurrentTenant();
    const provider = await withUserContext(user.id, (client) => createProvider(client, tenant.id, data));
    return NextResponse.json(provider, { status: 201 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
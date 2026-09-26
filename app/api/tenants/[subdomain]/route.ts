import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { getTenantBySubdomain } from "@/app/features/tenants/tenants.service";

interface RouteParams {
  params: Promise<{ subdomain: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { subdomain } = await params;
    const user = getOptionalAuthUser(req);
    const tenant = await withUserContext(user?.id ?? null, (client) => getTenantBySubdomain(client, subdomain));
    if (!tenant) {
      return NextResponse.json({ message: "Tenant not found" }, { status: 404 });
    }
    return NextResponse.json(tenant, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
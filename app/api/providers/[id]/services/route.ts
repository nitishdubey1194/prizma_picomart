import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser, getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { getCurrentTenant } from "@/lib/tenant";
import { linkServiceSchema } from "@/app/features/providers/provider-services.schema";
import { listProviderServices, linkService } from "@/app/features/providers/provider-services.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getOptionalAuthUser(req);
    const services = await withUserContext(user?.id ?? null, (client) => listProviderServices(client, Number(id)));
    return NextResponse.json(services, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const body = await req.json();
    const data = linkServiceSchema.parse(body);
    const tenant = await getCurrentTenant();
    const providerService = await withUserContext(user.id, (client) =>
      linkService(client, tenant.id, Number(id), data)
    );
    return NextResponse.json(providerService, { status: 201 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
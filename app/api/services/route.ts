import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser, getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { getCurrentTenant } from "@/lib/tenant";
import { createServiceSchema } from "@/app/features/services/services.schema";
import { listServices, createService } from "@/app/features/services/services.service";

export async function GET(req: NextRequest) {
  try {
    const user = getOptionalAuthUser(req);
    const services = await withUserContext(user?.id ?? null, (client) => listServices(client));
    return NextResponse.json(services, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const body = await req.json();
    const data = createServiceSchema.parse(body);
    const tenant = await getCurrentTenant();
    const service = await withUserContext(user.id, (client) => createService(client, tenant.id, data));
    return NextResponse.json(service, { status: 201 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
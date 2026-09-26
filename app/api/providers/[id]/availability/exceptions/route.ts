import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser, getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { getCurrentTenant } from "@/lib/tenant";
import { createExceptionSchema } from "@/app/features/availability/availability.schema";
import { listExceptions, createException } from "@/app/features/availability/availability.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getOptionalAuthUser(req);
    const exceptions = await withUserContext(user?.id ?? null, (client) => listExceptions(client, Number(id)));
    return NextResponse.json(exceptions, { status: 200 });
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
    const data = createExceptionSchema.parse(body);
    const tenant = await getCurrentTenant();
    const exception = await withUserContext(user.id, (client) =>
      createException(client, tenant.id, Number(id), data)
    );
    return NextResponse.json(exception, { status: 201 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
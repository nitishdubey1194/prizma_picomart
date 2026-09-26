import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser, getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { getCurrentTenant } from "@/lib/tenant";
import { createAvailabilityBlockSchema } from "@/app/features/availability/availability.schema";
import { listAvailabilityBlocks, createAvailabilityBlock } from "@/app/features/availability/availability.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getOptionalAuthUser(req);
    const blocks = await withUserContext(user?.id ?? null, (client) => listAvailabilityBlocks(client, Number(id)));
    return NextResponse.json(blocks, { status: 200 });
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
    const data = createAvailabilityBlockSchema.parse(body);
    const tenant = await getCurrentTenant();
    const block = await withUserContext(user.id, (client) =>
      createAvailabilityBlock(client, tenant.id, Number(id), data)
    );
    return NextResponse.json(block, { status: 201 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { updateAvailabilityBlockSchema } from "@/app/features/availability/availability.schema";
import { updateAvailabilityBlock, deleteAvailabilityBlock } from "@/app/features/availability/availability.service";

interface RouteParams {
  params: Promise<{ id: string; blockId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { blockId } = await params;
    const user = getAuthUser(req);
    const body = await req.json();
    const data = updateAvailabilityBlockSchema.parse(body);
    const block = await withUserContext(user.id, (client) => updateAvailabilityBlock(client, Number(blockId), data));
    if (!block) throw new AppError(404, "Availability block not found.");
    return NextResponse.json(block, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { blockId } = await params;
    const user = getAuthUser(req);
    const deleted = await withUserContext(user.id, (client) => deleteAvailabilityBlock(client, Number(blockId)));
    if (!deleted) throw new AppError(404, "Availability block not found.");
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
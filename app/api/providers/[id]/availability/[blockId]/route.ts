import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import { deleteRecurringBlock } from "@/app/features/availability/availability.service";
import { AppError } from "@/lib/errors";

type RouteParams = RouteContext<"/api/providers/[id]/availability/[blockId]">;

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, blockId } = await params;
    const providerId = Number(id);
    const parsedBlockId = Number(blockId);

    if (!providerId || !parsedBlockId) {
      return NextResponse.json(
        { error: "Valid provider ID and block ID are required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const result = await deleteRecurringBlock(tenant.id, user.id, providerId, parsedBlockId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to delete block";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
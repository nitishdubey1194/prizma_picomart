import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { unlinkService } from "@/app/features/providers/provider-services.service";

interface RouteParams {
  params: Promise<{ id: string; serviceId: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id, serviceId } = await params;
    const user = getAuthUser(req);
    const unlinked = await withUserContext(user.id, (client) =>
      unlinkService(client, Number(id), Number(serviceId))
    );
    if (!unlinked) throw new AppError(404, "This service isn't linked to this provider.");
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
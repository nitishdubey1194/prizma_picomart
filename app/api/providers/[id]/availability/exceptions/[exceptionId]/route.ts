import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import { removeProviderException } from "@/app/features/availability/availability.service";
import { AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{
    id: string;
    exceptionId: string;
  }>;
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, exceptionId } = await params;
    const providerId = Number(id);
    const parsedExceptionId = Number(exceptionId);

    if (!providerId || !parsedExceptionId) {
      return NextResponse.json(
        { error: "Valid provider ID and exception ID are required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();

    const result = await removeProviderException(
      tenant.id,
      user.id,
      providerId,
      parsedExceptionId
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to remove schedule exception";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
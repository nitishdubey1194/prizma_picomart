import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { refreshTokenSchema } from "@/app/features/auth/auth.schema";
import { refreshUserTokens } from "@/app/features/auth/auth.service";
import { AppError } from "@/lib/errors";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody: unknown = await request.json();
    const { refreshToken } = refreshTokenSchema.parse(rawBody);

    const tenant = await getCurrentTenant();
    const tokens = await refreshUserTokens(Number(tenant.id), refreshToken);

    return NextResponse.json({ tokens }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Token refresh failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { refreshTokenSchema } from "@/app/features/auth/auth.schema";
import { refreshUserTokens } from "@/app/features/auth/auth.service";
import { AppError } from "@/lib/errors";
import { ZodError } from "zod";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody: unknown = await request.json();
    const { refreshToken } = refreshTokenSchema.parse(rawBody);

    const tenant = await getCurrentTenant();
    const tokens = await refreshUserTokens(Number(tenant.id), refreshToken);

    return NextResponse.json({ tokens }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid refresh token." }, { status: 400 });
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Token refresh failed:", error);
    return NextResponse.json({ error: "Token refresh failed." }, { status: 500 });
  }
}
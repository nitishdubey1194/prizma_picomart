import { NextRequest, NextResponse } from "next/server";
import { refreshTokenSchema } from "@/app/features/auth/auth.schema";
import { logoutUser } from "@/app/features/auth/auth.service";
import { AppError } from "@/lib/errors";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody: unknown = await request.json();
    const { refreshToken } = refreshTokenSchema.parse(rawBody);

    await logoutUser(refreshToken);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Logout failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { refreshTokenSchema } from "@/app/features/auth/auth.schema";
import { logoutUser } from "@/app/features/auth/auth.service";
import { AppError } from "@/lib/errors";
import { ZodError } from "zod";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody: unknown = await request.json();
    const { refreshToken } = refreshTokenSchema.parse(rawBody);

    await logoutUser(refreshToken);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid refresh token." }, { status: 400 });
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Logout failed:", error);
    return NextResponse.json({ error: "Logout failed." }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { refreshSchema } from "@/app/features/auth/auth.schema";
import { revokeRefreshToken } from "@/app/features/auth/auth.service";
import { toErrorResponse } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = refreshSchema.parse(body);
    await revokeRefreshToken(refreshToken);
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
      const { status, message } = toErrorResponse(err);
      return NextResponse.json({ message }, { status });
    }
}
import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/app/features/auth/auth.schema";
import { registerUser } from "@/app/features/auth/auth.service";
import { toErrorResponse } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = registerSchema.parse(body);
    const tokens = await registerUser(email, password);
    return NextResponse.json(tokens, { status: 201 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
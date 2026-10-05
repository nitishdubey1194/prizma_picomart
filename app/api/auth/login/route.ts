import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { loginSchema } from "@/app/features/auth/auth.schema";
import { loginUser } from "@/app/features/auth/auth.service";
import { AppError } from "@/lib/errors";
import { ZodError } from "zod";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody: unknown = await request.json();
    const validatedInput = loginSchema.parse(rawBody);

    const tenant = await getCurrentTenant();
    const result = await loginUser(Number(tenant.id), validatedInput);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid login details." }, { status: 400 });
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Authentication service unavailable." }, { status: 500 });
  }
}
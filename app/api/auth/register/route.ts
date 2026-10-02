import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { registerSchema } from "@/app/features/auth/auth.schema";
import { registerUser } from "@/app/features/auth/auth.service";
import { AppError } from "@/lib/errors";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody: unknown = await request.json();
    const validatedInput = registerSchema.parse(rawBody);

    const tenant = await getCurrentTenant();
    const result = await registerUser(Number(tenant.id), validatedInput);

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to register";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
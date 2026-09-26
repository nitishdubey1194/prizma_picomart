import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/app/features/auth/auth.schema";
import { loginUser } from "@/app/features/auth/auth.service";
import { toErrorResponse } from "@/lib/errors";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = loginSchema.parse(body);
        const tokens = await loginUser(email, password);
        return NextResponse.json(tokens, { status: 200 });
    }catch (err: unknown) {
        const { status, message } = toErrorResponse(err);
        return NextResponse.json({ message }, { status });
    }
}
import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import { searchUsers } from "@/app/features/users/users.service";
import { AppError } from "@/lib/errors";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 10;

    if (!q.trim()) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    const tenant = await getCurrentTenant();
    const results = await searchUsers(tenant.id, q, limit);

    return NextResponse.json({ users: results }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to search users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
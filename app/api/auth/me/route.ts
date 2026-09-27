import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import { getUserProfileById } from "@/app/features/users/users.service";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authUser = await getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfileById(authUser.id);
  return NextResponse.json(
    {
      id: authUser.id,
      email: authUser.email,
      role: profile?.role ?? "customer",
      tenantId: authUser.tenantId,
      fullName: profile?.fullName ?? null,
      providerId: profile?.providerId ?? null
    },
    { status: 200 }
  );
}
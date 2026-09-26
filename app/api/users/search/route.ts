import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { searchUsersByEmail } from "@/app/features/users/users.service";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ message: "email query param is required" }, { status: 400 });
    }
    const results = await withUserContext(user.id, (client) => searchUsersByEmail(client, email));
    return NextResponse.json(results, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
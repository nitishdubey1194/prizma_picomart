import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);

    const { roles, providerId } = await withUserContext(user.id, async (client) => {
      const rolesResult = await client.query(
        "select role from user_roles where user_id = $1",
        [user.id]
      );
      const providerResult = await client.query(
        "select id from providers where user_id = $1",
        [user.id]
      );
      return {
        roles: rolesResult.rows.map((r) => r.role as string),
        providerId: providerResult.rows[0] ? Number(providerResult.rows[0].id) : null,
      };
    });

    return NextResponse.json({ ...user, roles, providerId }, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
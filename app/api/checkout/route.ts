import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { getCurrentTenant } from "@/lib/tenant";
import { checkoutSchema } from "@/app/features/orders/orders.schema";
import { checkout } from "@/app/features/orders/orders.service";

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const body = await req.json();
    const data = checkoutSchema.parse(body);
    const tenant = await getCurrentTenant();
    const result = await withUserContext(user.id, (client) => checkout(client, tenant.id, data));
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser, getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { getCurrentTenant } from "@/lib/tenant";
import { createCategorySchema } from "@/app/features/categories/categories.schema";
import { listCategories, createCategory } from "@/app/features/categories/categories.service";

export async function GET(req: NextRequest) {
  try {
    const user = getOptionalAuthUser(req);
    const categories = await withUserContext(user?.id ?? null, (client) => listCategories(client));
    return NextResponse.json(categories, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const body = await req.json();
    const data = createCategorySchema.parse(body);
    const tenant = await getCurrentTenant();
    const category = await withUserContext(user.id, (client) => createCategory(client, tenant.id, data));
    return NextResponse.json(category, { status: 201 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
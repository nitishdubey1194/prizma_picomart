import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import { 
  getTenantCategories,
  createCategory,
  type CreateCategoryInput,
} from "@/app/features/categories/categories.service";
import { AppError } from "@/lib/errors";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const tenant = await getCurrentTenant();
    const list = await getTenantCategories(tenant.id);

    return NextResponse.json({ categories: list }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateCategoryInput;

    if (!body?.name || !body?.slug) {
      return NextResponse.json(
        { error: "Fields 'name' and 'slug' are required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const category = await createCategory(tenant.id, user.id, body);

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create category";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
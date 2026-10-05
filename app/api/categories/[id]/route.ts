import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
  type UpdateCategoryInput,
} from "@/app/features/categories/categories.service";
import { AppError } from "@/lib/errors";

type RouteParams = RouteContext<"/api/categories/[id]">;

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const categoryId = Number(id);

    if (!categoryId) {
      return NextResponse.json(
        { error: "A valid category ID is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const category = await getCategoryById(tenant.id, categoryId);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ category }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const categoryId = Number(id);

    if (!categoryId) {
      return NextResponse.json(
        { error: "A valid category ID is required" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as UpdateCategoryInput;
    const tenant = await getCurrentTenant();

    const updated = await updateCategory(tenant.id, user.id, categoryId, body);

    return NextResponse.json({ category: updated }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to update category";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const categoryId = Number(id);

    if (!categoryId) {
      return NextResponse.json(
        { error: "A valid category ID is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const result = await deleteCategory(tenant.id, user.id, categoryId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to delete category";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getAuthUser, getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { updateCategorySchema } from "@/app/features/categories/categories.schema";
import { getCategoryById, updateCategory, deleteCategory } from "@/app/features/categories/categories.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getOptionalAuthUser(req);
    const category = await withUserContext(user?.id ?? null, (client) => getCategoryById(client, Number(id)));
    if (!category) throw new AppError(404, "Category not found.");
    return NextResponse.json(category, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const body = await req.json();
    const data = updateCategorySchema.parse(body);
    const category = await withUserContext(user.id, (client) => updateCategory(client, Number(id), data));
    if (!category) throw new AppError(404, "Category not found.");
    return NextResponse.json(category, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const deleted = await withUserContext(user.id, (client) => deleteCategory(client, Number(id)));
    if (!deleted) throw new AppError(404, "Category not found.");
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
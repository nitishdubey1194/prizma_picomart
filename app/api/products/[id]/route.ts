import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getAuthUser, getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { updateProductSchema } from "@/app/features/products/products.schema";
import { getProductById, updateProduct, deleteProduct } from "@/app/features/products/products.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getOptionalAuthUser(req);
    const product = await withUserContext(user?.id ?? null, (client) => getProductById(client, Number(id)));
    if (!product) throw new AppError(404, "Product not found.");
    return NextResponse.json(product, { status: 200 });
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
    const data = updateProductSchema.parse(body);
    const product = await withUserContext(user.id, (client) => updateProduct(client, Number(id), data));
    if (!product) throw new AppError(404, "Product not found.");
    return NextResponse.json(product, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const deleted = await withUserContext(user.id, (client) => deleteProduct(client, Number(id)));
    if (!deleted) throw new AppError(404, "Product not found.");
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
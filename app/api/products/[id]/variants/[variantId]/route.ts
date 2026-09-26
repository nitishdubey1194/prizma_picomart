import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { updateVariantSchema } from "@/app/features/products/products.schema";
import { updateVariant, deleteVariant } from "@/app/features/products/product-variants.service";

interface RouteParams {
  params: Promise<{ id: string; variantId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { variantId } = await params;
    const user = getAuthUser(req);
    const body = await req.json();
    const data = updateVariantSchema.parse(body);
    const variant = await withUserContext(user.id, (client) => updateVariant(client, Number(variantId), data));
    if (!variant) throw new AppError(404, "Variant not found.");
    return NextResponse.json(variant, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { variantId } = await params;
    const user = getAuthUser(req);
    const deleted = await withUserContext(user.id, (client) => deleteVariant(client, Number(variantId)));
    if (!deleted) throw new AppError(404, "Variant not found.");
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  updateProductImage,
  deleteProductImage,
  type UpdateProductImageInput,
} from "@/app/features/products/product-images.service";
import { AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{
    id: string;
    imageId: string;
  }>;
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

    const { id, imageId } = await params;
    const productId = Number(id);

    if (!productId || !imageId) {
      return NextResponse.json(
        { error: "Valid product ID and image ID are required" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as UpdateProductImageInput;
    const tenant = await getCurrentTenant();

    const updated = await updateProductImage(
      tenant.id,
      user.id,
      productId,
      imageId,
      body
    );

    return NextResponse.json({ image: updated }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to update product image";
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

    const { id, imageId } = await params;
    const productId = Number(id);

    if (!productId || !imageId) {
      return NextResponse.json(
        { error: "Valid product ID and image ID are required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const result = await deleteProductImage(tenant.id, user.id, productId, imageId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to delete product image";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
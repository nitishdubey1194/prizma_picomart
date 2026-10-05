import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getProductById,
  updateProduct,
  deleteProduct,
  type UpdateProductInput,
} from "@/app/features/products/products.service";
import { AppError } from "@/lib/errors";

type RouteParams = RouteContext<"/api/products/[id]">;

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!productId) {
      return NextResponse.json(
        { error: "A valid product ID is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const product = await getProductById(tenant.id, productId);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch product";
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
    const productId = Number(id);

    if (!productId) {
      return NextResponse.json(
        { error: "A valid product ID is required" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as UpdateProductInput;
    const tenant = await getCurrentTenant();

    const updated = await updateProduct(tenant.id, user.id, productId, body);

    return NextResponse.json({ product: updated }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to update product";
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
    const productId = Number(id);

    if (!productId) {
      return NextResponse.json(
        { error: "A valid product ID is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const result = await deleteProduct(tenant.id, user.id, productId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
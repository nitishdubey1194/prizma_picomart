import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getProductImages,
  addProductImage,
  type AddProductImageInput,
} from "@/app/features/products/product-images.service";
import { AppError } from "@/lib/errors";

type RouteParams = RouteContext<"/api/products/[id]/images">;

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
    const images = await getProductImages(tenant.id, productId);

    return NextResponse.json({ images }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load product images";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
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

    const body = (await request.json()) as AddProductImageInput;

    if (!body?.imageUrl) {
      return NextResponse.json(
        { error: "Field 'imageUrl' is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const image = await addProductImage(tenant.id, user.id, productId, body);

    return NextResponse.json({ image }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to add product image";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
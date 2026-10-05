import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getProductReviews,
  createProductReview,
  type CreateReviewInput,
} from "@/app/features/reviews/reviews.service";
import { AppError } from "@/lib/errors";

type RouteParams = RouteContext<"/api/products/[id]/reviews">;

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
    const result = await getProductReviews(tenant.id, productId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load product reviews";
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

    const body = (await request.json()) as Omit<CreateReviewInput, "productId">;

    if (!body?.orderId || typeof body?.rating !== "number") {
      return NextResponse.json(
        { error: "Fields 'orderId' and numerical 'rating' (1-5) are required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();

    const review = await createProductReview(tenant.id, user.id, {
      ...body,
      productId,
    });

    return NextResponse.json(
      {
        review: {
          ...review,
          id: review.id.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create review";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
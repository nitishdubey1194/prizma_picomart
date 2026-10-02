import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  updateProductReview,
  type UpdateReviewInput,
} from "@/app/features/reviews/reviews.service";
import { AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
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
    const body = (await request.json()) as UpdateReviewInput;
    const tenant = await getCurrentTenant();

    const updated = await updateProductReview(tenant.id, user.id, id, body);

    return NextResponse.json(
      {
        review: {
          ...updated,
          id: updated.id.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      ); 
    }
    const message =
      error instanceof Error ? error.message : "Failed to update review";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
import { db } from "@/lib/db/index";
import {
  orderReviews,
  orders,
  orderItems,
  productRatings,
} from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, desc, sql } from "drizzle-orm";

export interface CreateReviewInput {
  orderId: number | bigint | string;
  productId: number | bigint | string;
  rating: number;
  review?: string | null;
}

export interface UpdateReviewInput {
  rating?: number;
  review?: string | null;
}

function assertValidRating(rating: number): number {
  const normalized = Math.round(Number(rating));

  if (normalized < 1 || normalized > 5) {
    throw new AppError(400, "Rating must be an integer between 1 and 5.");
  }

  return normalized;
}

/**
 * Submits a rating/review for an item from a delivered order.
 */
export async function createProductReview(
  tenantId: number | bigint,
  userId: string,
  input: CreateReviewInput
) {
  const pTenantId = Number(tenantId);
  const pOrderId = Number(input.orderId);
  const pOrderIdBigInt = Number(input.orderId);
  const pProductId = Number(input.productId);
  const ratingVal = assertValidRating(input.rating);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // 1. Verify order belongs to user, belongs to tenant, and is delivered
    const [order] = await tx
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(
        and(
          eq(orders.id, pOrderIdBigInt),
          eq(orders.tenantId, pTenantId),
          eq(orders.userId, userId)
        )
      )
      .limit(1);

    if (!order) {
      throw new AppError(404, "Order not found or does not belong to you.");
    }

    if (order.status !== "delivered") {
      throw new AppError(400, "You can only review products from delivered orders.");
    }

    // 2. Verify that this specific product was in the order
    const [item] = await tx
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.orderId, pOrderId),
          eq(orderItems.productId, pProductId),
          eq(orderItems.tenantId, pTenantId)
        )
      )
      .limit(1);

    if (!item) {
      throw new AppError(400, "This product was not part of the specified order.");
    }

    // 3. Ensure the user has not already reviewed this product for this order
    const [existing] = await tx
      .select({ id: orderReviews.id })
      .from(orderReviews)
      .where(
        and(
          eq(orderReviews.orderId, pOrderId),
          eq(orderReviews.productId, pProductId),
          eq(orderReviews.userId, userId)
        )
      )
      .limit(1);

    if (existing) {
      throw new AppError(409, "You have already reviewed this product for this order.");
    }

    // 4. Insert review
    const [newReview] = await tx
      .insert(orderReviews)
      .values({
        tenantId: pTenantId,
        orderId: pOrderId,
        productId: pProductId,
        userId,
        rating: ratingVal,
        review: input.review ?? null,
      })
      .returning();

    return newReview;
  });
}

/**
 * Fetches reviews for a given product along with aggregate score from productRatings view.
 */
export async function getProductReviews(
  tenantId: number | bigint,
  productId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pProductId = Number(productId);

  // 1. Fetch aggregate metrics from product_ratings view
  const [metrics] = await db
    .select({
      averageRating: productRatings.averageRating,
      reviewCount: productRatings.reviewCount,
    })
    .from(productRatings)
    .where(eq(productRatings.productId, pProductId))
    .limit(1);

  // 2. Fetch individual reviews
  const reviewsList = await db
    .select({
      id: orderReviews.id,
      orderId: orderReviews.orderId,
      productId: orderReviews.productId,
      userId: orderReviews.userId,
      rating: orderReviews.rating,
      review: orderReviews.review,
      createdAt: orderReviews.createdAt,
      updatedAt: orderReviews.updatedAt,
    })
    .from(orderReviews)
    .where(
      and(
        eq(orderReviews.productId, pProductId),
        eq(orderReviews.tenantId, pTenantId)
      )
    )
    .orderBy(desc(orderReviews.createdAt));

  return {
    metrics: {
      averageRating: metrics?.averageRating ?? "0.0",
      reviewCount: metrics?.reviewCount ? Number(metrics.reviewCount) : 0,
    },
    reviews: reviewsList.map((r) => ({
      ...r,
      id: r.id.toString(),
    })),
  };
}

/**
 * Updates a previously submitted review.
 */
export async function updateProductReview(
  tenantId: number | bigint,
  userId: string,
  reviewId: number | bigint | string,
  input: UpdateReviewInput
) {
  const pTenantId = Number(tenantId);
  const pReviewIdBigInt = Number(reviewId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const updatePayload: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (input.rating !== undefined) {
      updatePayload.rating = assertValidRating(input.rating);
    }

    if (input.review !== undefined) {
      updatePayload.review = input.review;
    }

    const [updated] = await tx
      .update(orderReviews)
      .set(updatePayload)
      .where(
        and(
          eq(orderReviews.id, pReviewIdBigInt),
          eq(orderReviews.tenantId, pTenantId),
          eq(orderReviews.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Review not found or unauthorized to update.");
    }

    return updated;
  });
}
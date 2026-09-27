import { db } from "@/lib/db/index";
import { userCarts, productVariants, products } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, sql } from "drizzle-orm";

export interface AddCartItemInput {
  variantId: number | bigint | string;
  quantity: number;
}

export interface UpdateCartItemQuantityInput {
  quantity: number;
}

export interface CheckoutResultRow extends Record<string, unknown> {
  order_id: string | number;
  total_amount: string | number;
  status: string;
}

/**
 * Retrieves all items in the user's cart for the active tenant, joining variant and product data.
 */
export async function getUserCart(
  tenantId: number | bigint,
  userId: string
) {
  const pTenantId = Number(tenantId);

  const items = await db
    .select({
      id: userCarts.id,
      tenantId: userCarts.tenantId,
      userId: userCarts.userId,
      variantId: userCarts.variantId,
      quantity: userCarts.quantity,
      createdAt: userCarts.createdAt,
      updatedAt: userCarts.updatedAt,
      variant: {
        id: productVariants.id,
        productId: productVariants.productId,
        variantName: productVariants.variantName,
        sku: productVariants.sku,
        price: productVariants.price,
        discountPrice: productVariants.discountPrice,
        stockQty: productVariants.stockQty,
        maxBuyQty: productVariants.maxBuyQty,
      },
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        isActive: products.isActive,
      },
    })
    .from(userCarts)
    // userCarts.variantId is { mode: "number" }, productVariants.id is { mode: "bigint" } -> cast via sql or eq with BigInt
    .innerJoin(
      productVariants,
      sql`${productVariants.id} = ${userCarts.variantId}`
    )
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(
        eq(userCarts.tenantId, pTenantId),
        eq(userCarts.userId, userId)
      )
    );

  const subtotal = items.reduce((acc, item) => {
    const activePrice = item.variant.discountPrice
      ? Number(item.variant.discountPrice)
      : Number(item.variant.price);
    return acc + activePrice * item.quantity;
  }, 0);

  return {
    items,
    itemCount: items.reduce((acc, item) => acc + item.quantity, 0),
    subtotal: subtotal.toFixed(2),
  };
}

/**
 * Adds or increments an item in user_carts with inventory checks.
 */
export async function addItemToUserCart(
  tenantId: number | bigint,
  userId: string,
  input: AddCartItemInput
) {
  const pTenantId = Number(tenantId);
  const cartVariantIdNum = Number(input.variantId);
  const variantIdBigInt = BigInt(input.variantId); // Required for productVariants.id (mode: bigint)
  const quantityToAdd = Math.max(1, Number(input.quantity));

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // 1. Fetch variant using BigInt comparison for productVariants.id
    const [variant] = await tx
      .select({
        id: productVariants.id,
        stockQty: productVariants.stockQty,
        maxBuyQty: productVariants.maxBuyQty,
        productActive: products.isActive,
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(
        and(
          eq(productVariants.id, variantIdBigInt),
          eq(productVariants.tenantId, pTenantId)
        )
      )
      .limit(1);

    if (!variant || !variant.productActive) {
      throw new AppError(404, "Product variant is unavailable.");
    }

    const availableStock = variant.stockQty ?? 0;
    if (availableStock < quantityToAdd) {
      throw new AppError(400, `Insufficient stock. Only ${availableStock} units left.`);
    }

    // 2. Fetch existing cart record using number for userCarts.variantId
    const [existingItem] = await tx
      .select({
        id: userCarts.id,
        quantity: userCarts.quantity,
      })
      .from(userCarts)
      .where(
        and(
          eq(userCarts.tenantId, pTenantId),
          eq(userCarts.userId, userId),
          eq(userCarts.variantId, cartVariantIdNum)
        )
      )
      .limit(1);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantityToAdd;

      if (variant.maxBuyQty && newQuantity > variant.maxBuyQty) {
        throw new AppError(400, `Maximum purchase quantity of ${variant.maxBuyQty} exceeded.`);
      }

      if (newQuantity > availableStock) {
        throw new AppError(400, `Cannot add more. Exceeds available stock of ${availableStock}.`);
      }

      const [updated] = await tx
        .update(userCarts)
        .set({
          quantity: newQuantity,
          updatedAt: sql`now()`,
        })
        .where(eq(userCarts.id, existingItem.id))
        .returning();

      return updated;
    }

    if (variant.maxBuyQty && quantityToAdd > variant.maxBuyQty) {
      throw new AppError(400, `Maximum purchase limit for this item is ${variant.maxBuyQty}.`);
    }

    const [inserted] = await tx
      .insert(userCarts)
      .values({
        tenantId: pTenantId,
        userId,
        variantId: cartVariantIdNum,
        quantity: quantityToAdd,
      })
      .returning();

    return inserted;
  });
}

/**
 * Updates quantity for an existing cart item.
 */
export async function updateCartItemQuantity(
  tenantId: number | bigint,
  userId: string,
  cartItemId: number | bigint,
  input: UpdateCartItemQuantityInput
) {
  const pTenantId = Number(tenantId);
  const pCartItemId = Number(cartItemId);
  const newQuantity = Number(input.quantity);

  if (newQuantity <= 0) {
    return await removeCartItem(pTenantId, userId, pCartItemId);
  }

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const [item] = await tx
      .select({
        id: userCarts.id,
        variantId: userCarts.variantId,
        stockQty: productVariants.stockQty,
        maxBuyQty: productVariants.maxBuyQty,
      })
      .from(userCarts)
      .innerJoin(
        productVariants,
        sql`${productVariants.id} = ${userCarts.variantId}`
      )
      .where(
        and(
          eq(userCarts.id, pCartItemId),
          eq(userCarts.tenantId, pTenantId),
          eq(userCarts.userId, userId)
        )
      )
      .limit(1);

    if (!item) {
      throw new AppError(404, "Cart item not found.");
    }

    const availableStock = item.stockQty ?? 0;
    if (newQuantity > availableStock) {
      throw new AppError(400, `Requested quantity exceeds available stock (${availableStock}).`);
    }

    if (item.maxBuyQty && newQuantity > item.maxBuyQty) {
      throw new AppError(400, `Maximum allowed quantity is ${item.maxBuyQty}.`);
    }

    const [updated] = await tx
      .update(userCarts)
      .set({
        quantity: newQuantity,
        updatedAt: sql`now()`,
      })
      .where(eq(userCarts.id, pCartItemId))
      .returning();

    return updated;
  });
}

/**
 * Removes an item from user_carts.
 */
export async function removeCartItem(
  tenantId: number | bigint,
  userId: string,
  cartItemId: number | bigint
) {
  const pTenantId = Number(tenantId);
  const pCartItemId = Number(cartItemId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const deleted = await tx
      .delete(userCarts)
      .where(
        and(
          eq(userCarts.id, pCartItemId),
          eq(userCarts.tenantId, pTenantId),
          eq(userCarts.userId, userId)
        )
      )
      .returning();

    if (!deleted.length) {
      throw new AppError(404, "Cart item not found.");
    }

    return { success: true };
  });
}

/**
 * Clears the user's cart for the tenant.
 */
export async function clearUserCart(
  tenantId: number | bigint,
  userId: string
) {
  const pTenantId = Number(tenantId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    await tx
      .delete(userCarts)
      .where(
        and(
          eq(userCarts.tenantId, pTenantId),
          eq(userCarts.userId, userId)
        )
      );

    return { success: true };
  });
}
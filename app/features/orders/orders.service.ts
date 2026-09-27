import { db } from "@/lib/db/index";
import {
  orders,
  orderItems,
  userCarts,
  productVariants,
  products,
  stores,
  userAddresses,
  orderStatusLogs,
} from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, desc, sql } from "drizzle-orm";

export interface CreateOrderInput {
  addressId: number | bigint | string;
  storeId?: number | bigint | string | null;
  paymentMethod: "cod" | "upi" | "card" | "wallet" | "netbanking";
  deliveryType?: "pickup" | "delivery";
  deliveryNotes?: string | null;
}

export interface OrderItemSummary {
  id: bigint;
  orderId: number;
  productId: number;
  variantId: number;
  productName: string;
  variantName: string;
  price: string;
  quantity: number;
  subtotal: string;
}

export interface OrderWithItems {
  id: bigint;
  orderNumber: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned" | "failed" | "out_for_delivery";
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  paymentMethod: "cod" | "upi" | "card" | "wallet" | "netbanking";
  deliveryType: "pickup" | "delivery";
  totalAmount: string;
  payableAmount: string;
  shippingFee: string;
  taxAmount: string;
  handlingAmount: string;
  placedAt: string;
  items: OrderItemSummary[];
}

export interface UpdateOrderStatusInput {
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned"
    | "failed"
    | "out_for_delivery";
  remarks?: string | null;
}

/**
 * Creates an order directly from the user's active cart items.
 * Validates stock, deducts inventory, populates order_items, and clears user_carts.
 */
export async function createOrderFromCart(
  tenantId: number | bigint,
  userId: string,
  input: CreateOrderInput
): Promise<{ orderId: bigint; orderNumber: string }> {
  const pTenantId = Number(tenantId);
  const pAddressId = Number(input.addressId);
  const pAddressIdBigInt = BigInt(input.addressId);
  const pStoreId = input.storeId ? Number(input.storeId) : null;

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // 1. Verify user address belongs to this user and tenant
    const [address] = await tx
      .select({ id: userAddresses.id })
      .from(userAddresses)
      .where(
        and(
          eq(userAddresses.id, pAddressIdBigInt),
          eq(userAddresses.tenantId, pTenantId),
          eq(userAddresses.userId, userId)
        )
      )
      .limit(1);

    if (!address) {
      throw new AppError(404, "Delivery address not found or invalid.");
    }

    // 2. Fetch cart items with associated variant and product details
    const cartEntries = await tx
      .select({
        cartId: userCarts.id,
        variantId: userCarts.variantId,
        quantity: userCarts.quantity,
        variant: {
          id: productVariants.id,
          productId: productVariants.productId,
          variantName: productVariants.variantName,
          price: productVariants.price,
          discountPrice: productVariants.discountPrice,
          stockQty: productVariants.stockQty,
        },
        product: {
          id: products.id,
          name: products.name,
          isActive: products.isActive,
        },
      })
      .from(userCarts)
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

    if (cartEntries.length === 0) {
      throw new AppError(400, "Your cart is empty.");
    }

    // 3. Verify product availability and calculate totals
    let calculatedSubtotal = 0;

    for (const item of cartEntries) {
      if (!item.product.isActive) {
        throw new AppError(400, `Product "${item.product.name}" is no longer active.`);
      }

      const availableStock = item.variant.stockQty ?? 0;
      if (availableStock < item.quantity) {
        throw new AppError(
          400,
          `Insufficient stock for "${item.product.name} (${item.variant.variantName})". Available: ${availableStock}`
        );
      }

      const effectiveUnitPrice = item.variant.discountPrice
        ? Number(item.variant.discountPrice)
        : Number(item.variant.price);

      calculatedSubtotal += effectiveUnitPrice * item.quantity;
    }

    // 4. Generate order number from sequence
    const [seqResult] = (await tx.execute<{ nextval: string }>(
      sql`SELECT nextval('order_number_seq')::text AS nextval`
    )) as unknown as [{ nextval: string }];

    const generatedOrderNumber = `ORD-${Date.now().toString().slice(-6)}-${seqResult.nextval}`;

    const totalAmountStr = calculatedSubtotal.toFixed(2);
    const payableAmountStr = calculatedSubtotal.toFixed(2);

    // 5. Insert order record
    const [newOrder] = await tx
      .insert(orders)
      .values({
        tenantId: pTenantId,
        userId,
        storeId: pStoreId,
        orderNumber: generatedOrderNumber,
        status: "pending",
        totalAmount: totalAmountStr,
        payableAmount: payableAmountStr,
        discountAmount: "0.00",
        taxAmount: "0.00",
        shippingFee: "0.00",
        handlingAmount: "0.00",
        paymentStatus: "pending",
        paymentMethod: input.paymentMethod,
        addressId: pAddressId,
        deliveryType: input.deliveryType ?? "delivery",
        deliveryNotes: input.deliveryNotes ?? null,
      })
      .returning({ id: orders.id, orderNumber: orders.orderNumber });

    const orderIdNum = Number(newOrder.id);

    // 6. Insert order items and deduct stock
    for (const item of cartEntries) {
      const effectivePrice = item.variant.discountPrice
        ? item.variant.discountPrice
        : item.variant.price;

      const lineSubtotal = (Number(effectivePrice) * item.quantity).toFixed(2);

      await tx.insert(orderItems).values({
        tenantId: pTenantId,
        orderId: orderIdNum,
        productId: item.variant.productId,
        variantId: item.variantId,
        productName: item.product.name,
        variantName: item.variant.variantName,
        price: item.variant.price,
        discountPrice: item.variant.discountPrice ?? null,
        taxAmount: "0.00",
        quantity: item.quantity,
        subtotal: lineSubtotal,
      });

      // Deduct inventory
      await tx
        .update(productVariants)
        .set({
          stockQty: sql`${productVariants.stockQty} - ${item.quantity}`,
          updatedAt: sql`now()`,
        })
        .where(eq(productVariants.id, item.variant.id));
    }

    // 7. Clear user's cart
    await tx
      .delete(userCarts)
      .where(
        and(
          eq(userCarts.tenantId, pTenantId),
          eq(userCarts.userId, userId)
        )
      );

    // 8. Record initial status in order_status_logs
    await tx.insert(orderStatusLogs).values({
      tenantId: pTenantId,
      orderId: orderIdNum,
      status: "pending",
      remarks: "Order created successfully from checkout.",
      changedBy: userId,
    });

    return {
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
    };
  });
}

/**
 * Retrieves an order by its ID with all associated items.
 */
export async function getOrderById(
  tenantId: number | bigint,
  userId: string,
  orderId: number | bigint | string
): Promise<OrderWithItems | null> {
  const pTenantId = Number(tenantId);
  const pOrderIdBigInt = BigInt(orderId);
  const pOrderIdNum = Number(orderId);

  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      deliveryType: orders.deliveryType,
      totalAmount: orders.totalAmount,
      payableAmount: orders.payableAmount,
      shippingFee: orders.shippingFee,
      taxAmount: orders.taxAmount,
      handlingAmount: orders.handlingAmount,
      placedAt: orders.placedAt,
    })
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
    return null;
  }

  const items = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      variantId: orderItems.variantId,
      productName: orderItems.productName,
      variantName: orderItems.variantName,
      price: orderItems.price,
      quantity: orderItems.quantity,
      subtotal: orderItems.subtotal,
    })
    .from(orderItems)
    .where(
      and(
        eq(orderItems.orderId, pOrderIdNum),
        eq(orderItems.tenantId, pTenantId)
      )
    );

  return {
    ...order,
    items,
  };
}

/**
 * Lists all orders placed by an authenticated user for the active tenant.
 */
export async function getUserOrders(
  tenantId: number | bigint,
  userId: string
) {
  const pTenantId = Number(tenantId);

  return await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      deliveryType: orders.deliveryType,
      payableAmount: orders.payableAmount,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, pTenantId),
        eq(orders.userId, userId)
      )
    )
    .orderBy(desc(orders.placedAt));
}
export async function updateOrderStatus(
  tenantId: number | bigint,
  adminUserId: string,
  orderId: number | bigint | string,
  input: UpdateOrderStatusInput
) {
  const pTenantId = Number(tenantId);
  const pOrderIdBigInt = BigInt(orderId);
  const pOrderIdNum = Number(orderId);

  return await withTenantContext(pTenantId, adminUserId, async (tx) => {
    // 1. Fetch current order status
    const [existingOrder] = await tx
      .select({
        id: orders.id,
        currentStatus: orders.status,
      })
      .from(orders)
      .where(
        and(
          eq(orders.id, pOrderIdBigInt),
          eq(orders.tenantId, pTenantId)
        )
      )
      .limit(1);

    if (!existingOrder) {
      throw new AppError(404, "Order not found.");
    }

    if (existingOrder.currentStatus === input.status) {
      return { success: true, message: "Order is already in this status." };
    }

    // 2. Update order record
    const updatePayload: Record<string, unknown> = {
      status: input.status,
      updatedAt: sql`now()`,
    };

    if (input.status === "delivered") {
      updatePayload.deliveredAt = sql`now()`;
    } else if (input.status === "cancelled") {
      updatePayload.cancelledAt = sql`now()`;
    }

    await tx
      .update(orders)
      .set(updatePayload)
      .where(
        and(
          eq(orders.id, pOrderIdBigInt),
          eq(orders.tenantId, pTenantId)
        )
      );

    // 3. Append to order_status_logs
    await tx.insert(orderStatusLogs).values({
      tenantId: pTenantId,
      orderId: pOrderIdNum,
      status: input.status,
      remarks: input.remarks ?? `Status updated to ${input.status}.`,
      changedBy: adminUserId,
    });

    // 4. Restore product variant inventory if cancelled from an active state
    if (
      input.status === "cancelled" &&
      existingOrder.currentStatus !== "cancelled"
    ) {
      const itemsToRestore = await tx
        .select({
          variantId: orderItems.variantId,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(
          and(
            eq(orderItems.orderId, pOrderIdNum),
            eq(orderItems.tenantId, pTenantId)
          )
        );

      for (const item of itemsToRestore) {
        await tx
          .update(productVariants)
          .set({
            stockQty: sql`${productVariants.stockQty} + ${item.quantity}`,
            updatedAt: sql`now()`,
          })
          .where(eq(productVariants.id, BigInt(item.variantId)));
      }
    }

    return { success: true, newStatus: input.status };
  });
}
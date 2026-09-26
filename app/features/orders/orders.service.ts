import { PoolClient } from "pg";
import { CheckoutResult, Order, OrderItem } from "./orders.types";

export async function checkout(
  client: PoolClient,
  tenantId: number,
  data: { addressId: number; paymentMethod: string; deliveryNotes?: string }
): Promise<CheckoutResult> {
  const result = await client.query(
    "select * from checkout($1, $2, $3, $4)",
    [tenantId, data.addressId, data.paymentMethod, data.deliveryNotes ?? null]
  );
  const row = result.rows[0];
  return {
    orderId: Number(row.order_id),
    orderNumber: row.order_number,
    payableAmount: Number(row.payable_amount),
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
  };
}

function mapOrder(row: { id: string; order_number: string; status: string; total_amount: string; discount_amount: string; tax_amount: string; shipping_fee: string; handling_amount: string; payable_amount: string, payment_status: string; payment_method: string; address_id: string; delivery_type: string; delivery_notes: string | null; placed_at: string }): Order {
  return {
    id: Number(row.id),
    orderNumber: row.order_number,
    status: row.status,
    totalAmount: Number(row.total_amount),
    discountAmount: Number(row.discount_amount),
    taxAmount: Number(row.tax_amount),
    shippingFee: Number(row.shipping_fee),
    handlingAmount: Number(row.handling_amount),
    payableAmount: Number(row.payable_amount),
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    addressId: Number(row.address_id),
    deliveryType: row.delivery_type,
    deliveryNotes: row.delivery_notes,
    placedAt: row.placed_at,
  };
}

function mapItem(row: { id: string; product_id: string; variant_id: string; product_name: string; product_image: string | null; variant_name: string; price: string; discount_price: string | null; quantity: number, subtotal: string }): OrderItem {
  return {
    id: Number(row.id),
    productId: Number(row.product_id),
    variantId: Number(row.variant_id),
    productName: row.product_name,
    productImage: row.product_image,
    variantName: row.variant_name,
    price: Number(row.price),
    discountPrice: row.discount_price !== null ? Number(row.discount_price) : null,
    quantity: row.quantity,
    subtotal: Number(row.subtotal),
  };
}

export async function listOrders(client: PoolClient): Promise<Order[]> {
  const result = await client.query("select * from orders order by placed_at desc");
  return result.rows.map(mapOrder);
}

export async function getOrderById(client: PoolClient, id: number): Promise<(Order & { items: OrderItem[] }) | null> {
  const orderResult = await client.query("select * from orders where id = $1", [id]);
  if (!orderResult.rowCount) return null;

  const itemsResult = await client.query("select * from order_items where order_id = $1", [id]);
  return { ...mapOrder(orderResult.rows[0]), items: itemsResult.rows.map(mapItem) };
}
export async function updateOrderStatus(
  client: PoolClient,
  id: number,
  status: string,
  remarks: string | undefined
): Promise<Order | null> {
  const timestampClause =
    status === "delivered" ? ", delivered_at = now()" :
    status === "cancelled" ? ", cancelled_at = now()" : "";

  const result = await client.query(
    `update orders set status = $1, updated_at = now()${timestampClause} where id = $2 returning *`,
    [status, id]
  );
  if (!result.rowCount) return null;

  const order = result.rows[0];
  await client.query(
    `insert into order_status_logs (order_id, tenant_id, status, remarks) values ($1, $2, $3, $4)`,
    [id, order.tenant_id, status, remarks ?? `Status updated to ${status}`]
  );

  return mapOrder(order);
}

export async function cancelOrder(client: PoolClient, orderId: number, reason?: string): Promise<void> {
  await client.query("select cancel_order($1, $2)", [orderId, reason ?? null]);
}
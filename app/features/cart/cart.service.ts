import { PoolClient } from "pg";
import { CartItem } from "./cart.types";

function mapRow(row: { id: string; variant_id: string; quantity: number; variant_name: string; price: string; discount_price: string | null; stock_qty: number; product_id: string; product_name: string }): CartItem {
  const effectivePrice = Number(row.discount_price ?? row.price);
  return {
    id: Number(row.id),
    variantId: Number(row.variant_id),
    quantity: row.quantity,
    variantName: row.variant_name,
    price: Number(row.price),
    discountPrice: row.discount_price !== null ? Number(row.discount_price) : null,
    stockQty: row.stock_qty,
    productId: Number(row.product_id),
    productName: row.product_name,
    lineTotal: Number((effectivePrice * row.quantity).toFixed(2)),
  };
}

export async function listCartItems(client: PoolClient, userId: string): Promise<CartItem[]> {
  const result = await client.query(
    `select uc.id, uc.variant_id, uc.quantity,
            pv.variant_name, pv.price, pv.discount_price, pv.stock_qty,
            p.id as product_id, p.name as product_name
     from user_carts uc
     join product_variants pv on pv.id = uc.variant_id
     join products p on p.id = pv.product_id
     where uc.user_id = $1
     order by uc.created_at`,
    [userId]
  );
  return result.rows.map(mapRow);
}

export async function addToCart(
  client: PoolClient,
  tenantId: number,
  userId: string,
  variantId: number,
  quantity: number
): Promise<void> {
  await client.query(
    `insert into user_carts (tenant_id, user_id, variant_id, quantity)
     values ($1, $2, $3, $4)
     on conflict (user_id, variant_id)
     do update set quantity = user_carts.quantity + excluded.quantity, updated_at = now()`,
    [tenantId, userId, variantId, quantity]
  );
}

export async function updateCartItemQuantity(client: PoolClient, id: number, quantity: number): Promise<boolean> {
  const result = await client.query(
    "update user_carts set quantity = $1, updated_at = now() where id = $2",
    [quantity, id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function removeCartItem(client: PoolClient, id: number): Promise<boolean> {
  const result = await client.query("delete from user_carts where id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function clearCart(client: PoolClient, userId: string): Promise<void> {
  await client.query("delete from user_carts where user_id = $1", [userId]);
}
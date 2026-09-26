export interface CartItem {
  id: number;
  variantId: number;
  quantity: number;
  variantName: string;
  price: number;
  discountPrice: number | null;
  stockQty: number;
  productId: number;
  productName: string;
  lineTotal: number;
}
export interface CheckoutResult {
  orderId: number;
  orderNumber: string;
  payableAmount: number;
  paymentStatus: string;
  orderStatus: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  handlingAmount: number;
  payableAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  addressId: number;
  deliveryType: string;
  deliveryNotes: string | null;
  placedAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  variantId: number;
  productName: string;
  productImage: string | null;
  variantName: string;
  price: number;
  discountPrice: number | null;
  quantity: number;
  subtotal: number;
}
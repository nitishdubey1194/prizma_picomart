export interface Product {
  id: number;
  tenantId: number;
  categoryId: number | null;
  storeId: number | null;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  isActive: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  tenantId: number;
  variantName: string;
  sku: string | null;
  price: number;
  discountPrice: number | null;
  stockQty: number;
  maxBuyQty: number | null;
  attributes: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
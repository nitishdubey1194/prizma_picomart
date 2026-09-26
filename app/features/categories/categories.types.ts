export interface Category {
  id: number;
  tenantId: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Provider {
  id: number;
  tenantId: number;
  userId: string | null;
  name: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  slug: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}
export interface Service {
  id: number;
  tenantId: number;
  name: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  bufferMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Appointment {
  id: number;
  tenantId: number;
  providerId: number;
  serviceId: number;
  userId: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  price: number;
  customerNotes: string | null;
  internalNotes: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  localDate: string;
  createdAt: string;
  updatedAt: string;
}
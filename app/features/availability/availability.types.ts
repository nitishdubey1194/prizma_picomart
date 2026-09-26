export interface AvailabilityBlock {
  id: number;
  tenantId: number;
  providerId: number;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface AvailabilityException {
  id: number;
  tenantId: number;
  providerId: number;
  exceptionDate: string;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}
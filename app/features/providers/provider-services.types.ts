export interface ProviderService {
  id: number;
  providerId: number;
  serviceId: number;
  serviceName: string;
  priceOverride: number | null;
  durationOverrideMinutes: number | null;
  effectivePrice: number;
  effectiveDurationMinutes: number;
  isActive: boolean;
}
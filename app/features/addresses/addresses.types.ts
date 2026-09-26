export interface Address {
  id: number;
  name: string | null;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  latitude: number | null;
  longitude: number | null;
}
import { z } from "zod";

export const PROVIDER_CATEGORIES = [
  { value: "barber-shop", label: "Barber Shop" },
  { value: "car-wash", label: "Car Wash" },
  { value: "salon-spa", label: "Salon & Spa" },
  { value: "auto-detailing", label: "Auto Detailing" },
  { value: "health-wellness", label: "Health & Wellness" },
] as const;

export const providerCategoryEnum = z.enum([
  "barber-shop",
  "car-wash",
  "salon-spa",
  "auto-detailing",
  "health-wellness",
]);

export const createProviderSchema = z.object({
  name: z.string().min(1).max(150),
  slug: z.string().min(1).max(150),
  category:providerCategoryEnum,
  title: z.string().max(150).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().max(255).optional(),
  userId: z.string().uuid().optional(),
});

export const updateProviderSchema = createProviderSchema.partial().extend({
  isActive: z.boolean().optional(),
});
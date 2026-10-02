import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  mobile: z.string().trim().min(10, "Mobile number must be at least 10 digit"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  fullname: z.string().trim().min(2, "Full name must be at least 2 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
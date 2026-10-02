export type AppRole = "super_admin" | "admin" | "vendor" | "customer";

export interface RegisterInput {
  email: string;
  password: string;
  fullname: string;
  mobile: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: AppRole;
  tenantId?: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role?: AppRole;
  tenantId?: number;
  exp?: number;
  iat?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { AuthenticatedUser, TokenPayload } from "./auth.types";

const JWT_SECRET: string = process.env.JWT_SECRET ?? "default-access-secret-minimum-32-chars";
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken(): string {
  return randomBytes(40).toString("hex");
}

export function generateAccessToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "object" && decoded !== null && "userId" in decoded && "email" in decoded) {
      return decoded as TokenPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAuthUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    return null;
  }

  return {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    tenantId: payload.tenantId,
  };
}
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { AuthUser } from "./auth.types";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const ACCESS_TTL = (process.env.ACCESS_TOKEN_TTL || "15m") as jwt.SignOptions["expiresIn"];
export const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(user: AuthUser) {
  return jwt.sign({ sub: user.id, email: user.email }, ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function verifyAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, ACCESS_SECRET) as { sub: string; email: string };
  return { id: payload.sub, email: payload.email };
}

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
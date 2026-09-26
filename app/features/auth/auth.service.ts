import { pool } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_TTL_DAYS,
} from "./auth.utils";
import { AuthUser, TokenPair } from "./auth.types";

async function issueTokenPair(user: AuthUser): Promise<TokenPair> {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await pool.query(
    `insert into refresh_tokens (user_id, token_hash, expires_at) values ($1, $2, $3)`,
    [user.id, hashToken(refreshToken), expiresAt]
  );

  return { accessToken, refreshToken };
}

export async function registerUser(email: string, password: string): Promise<TokenPair> {
  const existing = await pool.query("select id from users where email = $1", [email]);
  if (existing.rowCount) {
    throw new AppError(409, "An account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);
  const result = await pool.query(
    `insert into users (email, password_hash) values ($1, $2) returning id, email`,
    [email, passwordHash]
  );
  const user = result.rows[0] as AuthUser;
  return issueTokenPair(user);
}

export async function loginUser(email: string, password: string): Promise<TokenPair> {
  const result = await pool.query(
    "select id, email, password_hash from users where email = $1",
    [email]
  );
  if (!result.rowCount) {
    throw new AppError(401, "Invalid email or password.");
  }

  const row = result.rows[0];
  const valid = await comparePassword(password, row.password_hash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password.");
  }

  return issueTokenPair({ id: row.id, email: row.email });
}

export async function refreshTokenPair(refreshToken: string): Promise<TokenPair> {
  const tokenHash = hashToken(refreshToken);
  const result = await pool.query(
    `select rt.id, rt.user_id, u.email
     from refresh_tokens rt
     join users u on u.id = rt.user_id
     where rt.token_hash = $1 and rt.revoked_at is null and rt.expires_at > now()`,
    [tokenHash]
  );

  if (!result.rowCount) {
    throw new AppError(401, "Refresh token is invalid or expired.");
  }

  const row = result.rows[0];
  await pool.query("update refresh_tokens set revoked_at = now() where id = $1", [row.id]);

  return issueTokenPair({ id: row.user_id, email: row.email });
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  await pool.query(
    "update refresh_tokens set revoked_at = now() where token_hash = $1 and revoked_at is null",
    [tokenHash]
  );
}
import { db } from "@/lib/db";
import { users, profiles, refreshTokens, tenantUsers } from "@/drizzle/schema";
import { AppError } from "@/lib/errors";
import { and, eq, isNull, sql } from "drizzle-orm";
import { RegisterInput, LoginInput, AuthResponse, AuthTokens } from "./auth.types";
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateRefreshToken,
  generateAccessToken,
} from "./auth.utils";

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export async function registerUser(
  tenantId: number,
  input: RegisterInput
): Promise<AuthResponse> {
  const normalizedEmail = input.email.toLowerCase().trim();

  // 1. Check existing user
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`LOWER(${users.email}::text) = ${normalizedEmail}`)
    .limit(1);

  if (existingUser) {
    throw new AppError(409, "User with this email already exists.");
  }

  const passwordHash = await hashPassword(input.password);

  return await db.transaction(async (tx) => {
    // 2. Insert user[cite: 1]
    const [newUser] = await tx
      .insert(users)
      .values({
        email: sql`${normalizedEmail}::citext`,
        passwordHash,
      })
      .returning({ id: users.id });

    // 3. Insert profile[cite: 1]
    await tx.insert(profiles).values({
      id: newUser.id,
      fullName: input.fullName ?? null,
      email: normalizedEmail,
      tenantId,
      role: "customer",
    });

    // 4. Bind membership in tenant_users[cite: 1]
    await tx.insert(tenantUsers).values({
      tenantId,
      userId: newUser.id,
      role: "customer",
      isActive: true,
    });

    // 5. Generate and store refresh token[cite: 1]
    const rawRefreshToken = generateRefreshToken();
    const tokenDigest = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    await tx.insert(refreshTokens).values({
      userId: newUser.id,
      tokenHash: tokenDigest,
      expiresAt,
    });

    const accessToken = generateAccessToken({
      userId: newUser.id,
      email: normalizedEmail,
      role: "customer",
      tenantId,
    });

    return {
      user: {
        id: newUser.id,
        email: normalizedEmail,
        role: "customer",
        tenantId,
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  });
}

export async function loginUser(
  tenantId: number,
  input: LoginInput
): Promise<AuthResponse> {
  const normalizedEmail = input.email.toLowerCase().trim();

  // 1. Fetch user credentials and tenant role[cite: 1]
  const [userRecord] = await db
    .select({
      id: users.id,
      email: sql<string>`${users.email}::text`,
      passwordHash: users.passwordHash,
      role: tenantUsers.role,
      isTenantUserActive: tenantUsers.isActive,
    })
    .from(users)
    .leftJoin(
      tenantUsers,
      and(
        eq(tenantUsers.userId, users.id),
        eq(tenantUsers.tenantId, tenantId)
      )
    )
    .where(sql`LOWER(${users.email}::text) = ${normalizedEmail}`)
    .limit(1);

  if (!userRecord) {
    throw new AppError(401, "Invalid email or password.");
  }

  const isPasswordValid = await verifyPassword(input.password, userRecord.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password.");
  }

  if (userRecord.isTenantUserActive === false) {
    throw new AppError(403, "Your account has been deactivated for this tenant.");
  }

  const assignedRole = userRecord.role ?? "customer";

  // 2. Persist new refresh token[cite: 1]
  const rawRefreshToken = generateRefreshToken();
  const tokenDigest = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db.insert(refreshTokens).values({
    userId: userRecord.id,
    tokenHash: tokenDigest,
    expiresAt,
  });

  const accessToken = generateAccessToken({
    userId: userRecord.id,
    email: userRecord.email,
    role: assignedRole,
    tenantId,
  });

  return {
    user: {
      id: userRecord.id,
      email: userRecord.email,
      role: assignedRole,
      tenantId,
    },
    tokens: {
      accessToken,
      refreshToken: rawRefreshToken,
    },
  };
}

export async function refreshUserTokens(
  tenantId: number,
  rawRefreshToken: string
): Promise<AuthTokens> {
  const tokenDigest = hashToken(rawRefreshToken);

  // 1. Match active and unrevoked refresh token[cite: 1]
  const [storedToken] = await db
    .select({
      id: refreshTokens.id,
      userId: refreshTokens.userId,
      expiresAt: refreshTokens.expiresAt,
      revokedAt: refreshTokens.revokedAt,
      email: sql<string>`${users.email}::text`,
      role: tenantUsers.role,
    })
    .from(refreshTokens)
    .innerJoin(users, eq(users.id, refreshTokens.userId))
    .leftJoin(
      tenantUsers,
      and(
        eq(tenantUsers.userId, refreshTokens.userId),
        eq(tenantUsers.tenantId, tenantId)
      )
    )
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenDigest),
        isNull(refreshTokens.revokedAt)
      )
    )
    .limit(1);

  if (!storedToken) {
    throw new AppError(401, "Invalid or revoked refresh token.");
  }

  if (new Date(storedToken.expiresAt).getTime() < Date.now()) {
    throw new AppError(401, "Refresh token has expired. Please log in again.");
  }

  // 2. Token rotation: revoke old token and emit a new one[cite: 1]
  const nextRawRefreshToken = generateRefreshToken();
  const nextTokenDigest = hashToken(nextRawRefreshToken);
  const nextExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db.transaction(async (tx) => {
    await tx
      .update(refreshTokens)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(refreshTokens.id, storedToken.id));

    await tx.insert(refreshTokens).values({
      userId: storedToken.userId,
      tokenHash: nextTokenDigest,
      expiresAt: nextExpiresAt,
    });
  });

  const nextAccessToken = generateAccessToken({
    userId: storedToken.userId,
    email: storedToken.email,
    role: storedToken.role ?? "customer",
    tenantId,
  });

  return {
    accessToken: nextAccessToken,
    refreshToken: nextRawRefreshToken,
  };
}

export async function logoutUser(rawRefreshToken: string): Promise<void> {
  const tokenDigest = hashToken(rawRefreshToken);

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date().toISOString() })
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenDigest),
        isNull(refreshTokens.revokedAt)
      )
    );
}
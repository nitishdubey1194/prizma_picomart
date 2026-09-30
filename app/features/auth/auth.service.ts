import { db } from "@/lib/db";
import { users, profiles, refreshTokens, tenantUsers } from "@/drizzle/schema";
import { AppError } from "@/lib/errors";
import { and, eq, isNull, sql, or } from "drizzle-orm";
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
  const normalizedMobile = input.mobile.trim();
  const fullname = input.fullname.trim();
  // 1. Check existing user
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.tenantId, tenantId),
        or(
          sql`LOWER(${users.email}) = ${normalizedEmail}`,
          eq(users.mobile, normalizedMobile)
        )
      )
    )
    .limit(1);

  if (existingUser) {
    throw new AppError(409, "User with this email or mobile already exists.");
  }

  const passwordHash = await hashPassword(input.password);

  return await db.transaction(async (tx) => {
    // 2. Insert user[cite: 1]
    const [newUser] = await tx
      .insert(users)
      .values({
        email: sql`${normalizedEmail}`,
        mobile: sql`${normalizedMobile}`,
        fullname: sql`${fullname}`,
        passwordHash,
        tenantId
      })
      .returning({ id: users.id });

    // 3. Insert profile[cite: 1]
    await tx.insert(profiles).values({
      id: newUser.id,
      fullName: input.fullname ?? null,
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
      tenantId: tenantId,
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

  // 1. Fetch user joined with the specific tenant membership
  const [record] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      role: tenantUsers.role,
      isTenantUserActive: tenantUsers.isActive,
    })
    .from(users)
    .innerJoin(
      tenantUsers,
      and(
        eq(tenantUsers.userId, users.id),
        eq(tenantUsers.tenantId, tenantId)
      )
    )
    .where(sql`LOWER(${users.email}) = ${normalizedEmail}`)
    .limit(1);
  // Return generic 401 if user not found in this tenant
  if (!record) {
    throw new AppError(401, "Invalid email or password.");
  }

  // 2. Validate password first to prevent user enumeration
  const isPasswordValid = await verifyPassword(
    input.password,
    record.passwordHash
  );
  console.log(isPasswordValid)
  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password.");
  }

  // 3. Verify tenant-level active status
  if (!record.isTenantUserActive) {
    throw new AppError(403, "Your account has been deactivated for this tenant.");
  }

  const assignedRole = record.role ?? "customer";

  // 4. Generate and persist refresh token
  const rawRefreshToken = generateRefreshToken();
  const tokenDigest = hashToken(rawRefreshToken);
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  await db.insert(refreshTokens).values({
    userId: record.id,
    tenantId, // Ensure refresh token is bound to this tenant
    tokenHash: tokenDigest,
    expiresAt: expiresAt.toISOString(),
  });

  // 5. Issue access token
  const accessToken = generateAccessToken({
    userId: record.id,
    email: record.email,
    role: assignedRole,
    tenantId,
  });

  return {
    user: {
      id: record.id,
      email: record.email,
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
      tenantId: tenantId,
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
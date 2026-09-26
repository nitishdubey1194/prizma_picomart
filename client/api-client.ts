export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Storage is pluggable so the same client works everywhere:
 * - Web: wrap localStorage, or an in-memory var + httpOnly cookie for the refresh token
 * - Expo: wrap expo-secure-store
 */
export interface TokenStorage {
  getTokens(): Promise<TokenPair | null>;
  setTokens(tokens: TokenPair): Promise<void>;
  clearTokens(): Promise<void>;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface ApiClientOptions {
  baseUrl: string;
  storage: TokenStorage;
  /** Called when the refresh token itself is rejected — usually means "log the user out". */
  onAuthExpired?: () => void;
}

export function createApiClient({ baseUrl, storage, onAuthExpired }: ApiClientOptions) {
  let refreshInFlight: Promise<TokenPair> | null = null;

  async function refresh(): Promise<TokenPair> {
    const current = await storage.getTokens();
    if (!current) throw new ApiError(401, "Not logged in.");

    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });

    if (!res.ok) {
      await storage.clearTokens();
      onAuthExpired?.();
      throw new ApiError(res.status, "Session expired. Please log in again.");
    }

    const tokens: TokenPair = await res.json();
    await storage.setTokens(tokens);
    return tokens;
  }

  /** Ensures only ONE refresh call happens even if several requests 401 at the same time. */
  function refreshOnce(): Promise<TokenPair> {
    if (!refreshInFlight) {
      refreshInFlight = refresh().finally(() => {
        refreshInFlight = null;
      });
    }
    return refreshInFlight;
  }

  async function request<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
    const tokens = await storage.getTokens();

    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
        ...init.headers,
      },
    });

    if (res.status === 401 && !isRetry && tokens) {
      await refreshOnce();
      return request<T>(path, init, true); // retry exactly once
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, body.message || "Request failed.");
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  return {
    async register(email: string, password: string) {
      const tokens = await request<TokenPair>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await storage.setTokens(tokens);
      return tokens;
    },

    async login(email: string, password: string) {
      const tokens = await request<TokenPair>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await storage.setTokens(tokens);
      return tokens;
    },

    async logout() {
      const tokens = await storage.getTokens();
      if (tokens) {
        await fetch(`${baseUrl}/api/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        }).catch(() => {}); // best-effort — clear local state regardless
      }
      await storage.clearTokens();
    },

    /** Generic authenticated request for every future store/booking endpoint. */
    request,
  };
}
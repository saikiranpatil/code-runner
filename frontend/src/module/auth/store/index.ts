import type { ApiUser } from "@/types/api.types";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  user: ApiUser | null;
  accessToken: string | null;
  hasRefreshToken: boolean;
  accessTokenExpiresAt: number | null;
  isAuthenticated: boolean;
  status: AuthStatus;
  error: string | null;

  setSession: (
    user: ApiUser,
    accessToken: string,
    expiresIn: number // seconds
  ) => void;
  /** Attempt to get a new access token using the refresh token.
   *  Returns the new access token on success, null on failure. */
  refreshAccessToken: () => Promise<string | null>;
  /** Silently fetch an access token if none exists or it is about to expire. */
  ensureFreshToken: () => Promise<string | null>;
  /** Initialise auth state on app boot (reads persisted user, hits /me). */
  initAuth: () => Promise<void>;
  /** Hard logout – clears everything and calls the server logout endpoint. */
  logout: () => Promise<void>;
  /** Reset error field. */
  clearError: () => void;
}
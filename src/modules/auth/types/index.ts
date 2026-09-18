/**
 * Sanskarut Auth Client SDK Types
 */

export interface SanskarutAuthConfig {
  /**
   * The base URL of the Sanskarut Auth platform (e.g. "https://auth.example.com" or "http://localhost:3000")
   */
  authUrl: string;

  /**
   * The unique Application ID identifying your application namespace
   */
  applicationId: string;

  /**
   * OAuth 2.0 Client ID for this application (optional for public redirects)
   */
  clientId?: string;

  /**
   * The redirect URI to return to after authenticating
   */
  redirectUri?: string;

  /**
   * Automatic session token refresh enable flag (defaults to true)
   */
  autoRefresh?: boolean;

  /**
   * Interval in milliseconds between session health checks (default: 60000ms = 1 min)
   */
  refreshIntervalMs?: number;

  /**
   * Custom storage interface (defaults to window.localStorage in browser environments)
   */
  storage?: StorageAdapter;
}

export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  applicationId: string;
  role: "USER" | "DEVELOPER" | "ADMIN";
  emailVerified: boolean;
  avatarUrl?: string;
  createdAt?: string | Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  applicationId: string;
  expiresAt: string | Date;
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | "USER_UPDATED";

export type AuthStateCallback = (event: AuthChangeEvent, session: AuthSession | null, user: AuthUser | null) => void;

export interface LoginOptions {
  returnTo?: string;
  prompt?: "login" | "consent" | "select_account";
  loginHint?: string;
}

export interface SignupOptions {
  returnTo?: string;
}

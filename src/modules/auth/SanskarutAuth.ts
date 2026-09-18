import {
  SanskarutAuthConfig,
  AuthUser,
  AuthSession,
  AuthTokens,
  AuthStateCallback,
  AuthChangeEvent,
  LoginOptions,
  SignupOptions,
  StorageAdapter,
} from "./types";

class MemoryStorage implements StorageAdapter {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

export class SanskarutAuth {
  private config: SanskarutAuthConfig;
  private storage: StorageAdapter;
  private listeners = new Set<AuthStateCallback>();
  private currentUser: AuthUser | null = null;
  private currentSession: AuthSession | null = null;
  private accessToken: string | null = null;

  constructor(config: SanskarutAuthConfig) {
    this.config = {
      autoRefresh: true,
      refreshIntervalMs: 60000,
      ...config,
      // Normalize URLs by trimming trailing slashes
      authUrl: config.authUrl.replace(/\/+$/, ""),
    };

    if (typeof window !== "undefined" && window.localStorage) {
      this.storage = config.storage || window.localStorage;
    } else {
      this.storage = config.storage || new MemoryStorage();
    }
  }

  /**
   * Redirect the user to the hosted login page for this application namespace.
   * Hosted auth pages handle all authentication forms securely.
   */
  login(options?: LoginOptions): void {
    if (typeof window === "undefined") return;

    const returnTo = options?.returnTo || window.location.href;
    const url = new URL(`${this.config.authUrl}/login`);
    url.searchParams.set("application_id", this.config.applicationId);
    url.searchParams.set("return_to", returnTo);

    if (this.config.clientId) {
      url.searchParams.set("client_id", this.config.clientId);
    }
    if (options?.prompt) {
      url.searchParams.set("prompt", options.prompt);
    }
    if (options?.loginHint) {
      url.searchParams.set("login_hint", options.loginHint);
    }

    window.location.href = url.toString();
  }

  /**
   * Redirect the user to the hosted registration page for this application namespace.
   */
  signup(options?: SignupOptions): void {
    if (typeof window === "undefined") return;

    const returnTo = options?.returnTo || window.location.href;
    const url = new URL(`${this.config.authUrl}/signup`);
    url.searchParams.set("application_id", this.config.applicationId);
    url.searchParams.set("return_to", returnTo);

    if (this.config.clientId) {
      url.searchParams.set("client_id", this.config.clientId);
    }

    window.location.href = url.toString();
  }

  /**
   * Sign out the active user and invalidate sessions across application.
   */
  async logout(options?: { redirectTo?: string }): Promise<void> {
    try {
      await fetch(`${this.config.authUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: this.config.applicationId }),
      });
    } catch {
      // Ignore network errors during logout
    } finally {
      this.currentUser = null;
      this.currentSession = null;
      this.accessToken = null;
      await this.storage.removeItem(`sanskarut_auth_${this.config.applicationId}_tokens`);
      this.notifyListeners("SIGNED_OUT", null, null);

      if (options?.redirectTo && typeof window !== "undefined") {
        window.location.href = options.redirectTo;
      }
    }
  }

  /**
   * Fetch or return active user session.
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      const res = await fetch(`${this.config.authUrl}/api/auth/session`, {
        credentials: "include",
      });

      if (!res.ok) {
        this.currentUser = null;
        this.currentSession = null;
        this.accessToken = null;
        return null;
      }

      const data = await res.json();
      const user = data?.user || data.user;
      if (!user) {
        this.currentUser = null;
        this.currentSession = null;
        this.accessToken = null;
        return null;
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        applicationId: user.application_id || user.applicationId || this.config.applicationId,
        role: user.role || "USER",
        emailVerified: Boolean(user.email_verified || user.emailVerified),
        avatarUrl: user.avatar_url,
      };

      const authSession: AuthSession = {
        id: data.data?.session?.id || `sess_${user.id}`,
        userId: user.id,
        applicationId: authUser.applicationId,
        expiresAt: data.data?.session?.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        accessToken: this.accessToken || undefined,
      };

      const previousUser = this.currentUser;
      this.currentUser = authUser;
      this.currentSession = authSession;

      if (!previousUser || previousUser.id !== authUser.id) {
        this.notifyListeners("SIGNED_IN", authSession, authUser);
      }

      return authSession;
    } catch {
      return null;
    }
  }

  /**
   * Return the current authenticated user profile.
   */
  async getUser(): Promise<AuthUser | null> {
    if (this.currentUser) return this.currentUser;
    await this.getSession();
    return this.currentUser;
  }

  /**
   * Check if user is currently authenticated.
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  /**
   * Returns current access token if available.
   */
  getAccessToken(): string | null {
    return this.accessToken || this.currentSession?.accessToken || null;
  }

  /**
   * Exchanges an OAuth authorization code or session code with Sanskarut Auth.
   */
  async exchangeAuthCode(
    code: string,
    redirectUri?: string,
    codeVerifier?: string
  ): Promise<{ success: boolean; session?: AuthSession | null; error?: string }> {
    try {
      const payload: Record<string, any> = {
        grant_type: "authorization_code",
        code,
        client_id: this.config.clientId || this.config.applicationId,
        redirect_uri: redirectUri || this.config.redirectUri || (typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""),
        code_verifier: codeVerifier || "none",
      };

      const res = await fetch(`${this.config.authUrl}/api/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error?.message || data.error || "Failed to exchange authorization code" };
      }

      if (data.access_token) {
        this.accessToken = data.access_token;
      }

      const session = await this.getSession();
      return { success: true, session };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error during code exchange" };
    }
  }

  /**
   * Refresh current credentials or tokens.
   */
  async refresh(): Promise<AuthSession | null> {
    try {
      const res = await fetch(`${this.config.authUrl}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const session = await this.getSession();
        this.notifyListeners("TOKEN_REFRESHED", session, this.currentUser);
        return session;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Subscribe to authentication lifecycle changes.
   */
  onAuthStateChange(callback: AuthStateCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: AuthChangeEvent, session: AuthSession | null, user: AuthUser | null): void {
    this.listeners.forEach((callback) => {
      try {
        callback(event, session, user);
      } catch (err) {
        console.error("[SanskarutAuth] Error in onAuthStateChange listener:", err);
      }
    });
  }

  /**
   * Returns current client configuration
   */
  getConfig(): SanskarutAuthConfig {
    return { ...this.config };
  }
}

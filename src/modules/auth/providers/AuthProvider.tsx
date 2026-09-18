"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { SanskarutAuth } from "../SanskarutAuth";
import { SanskarutAuthConfig, AuthUser, AuthSession, LoginOptions, SignupOptions } from "../types";
import { cleanCallbackUrl, sanitizeRedirectUrl } from "../utils/urlHelper";

export type AuthStatusTypes = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  client: SanskarutAuth;
  user: AuthUser | null;
  session: AuthSession | null;
  status: AuthStatusTypes;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (options?: LoginOptions) => void;
  signup: (options?: SignupOptions) => void;
  logout: (options?: { redirectTo?: string }) => Promise<void>;
  refresh: () => Promise<AuthSession | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  client?: SanskarutAuth;
  config?: SanskarutAuthConfig;
  redirectTo?: string;
  allowedRedirectOrigins?: string[];
  children: React.ReactNode;
}

export function AuthProvider({
  client: propClient,
  config,
  redirectTo = "/",
  allowedRedirectOrigins = [],
  children,
}: AuthProviderProps) {
  const client = useMemo(() => {
    if (propClient) return propClient;
    if (config) return new SanskarutAuth(config);
    throw new Error("AuthProvider requires either a 'client' or a 'config' prop.");
  }, [propClient, config]);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatusTypes>("loading");
  const processedCallbackRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // Step 1: Check if browser URL contains an OAuth authorization code or session code
      if (typeof window !== "undefined" && !processedCallbackRef.current) {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code") || urlParams.get("sessionCode") || urlParams.get("session_code");
        const state = urlParams.get("state");

        if (code) {
          processedCallbackRef.current = true;
          try {
            // Exchange code with Sanskarut Auth
            const exchangeResult = await client.exchangeAuthCode(code);

            // Clean code and state from URL preserving other search parameters (e.g. ?q=shoes&page=2)
            cleanCallbackUrl();

            if (exchangeResult.success && exchangeResult.session) {
              const activeUser = await client.getUser();
              if (isMounted) {
                setSession(exchangeResult.session);
                setUser(activeUser);
                setStatus("authenticated");
              }

              // If state contains a validated return destination, safely navigate
              if (state) {
                const safeDest = sanitizeRedirectUrl(state, allowedRedirectOrigins);
                if (safeDest !== "/" && safeDest !== window.location.pathname) {
                  window.location.replace(safeDest);
                }
              }
              return;
            }
          } catch (err) {
            console.error("[AuthProvider] Code exchange error:", err);
          }
        }
      }

      // Step 2: Check existing session
      try {
        const currentSession = await client.getSession();
        if (!isMounted) return;

        if (currentSession) {
          const currentUser = await client.getUser();
          if (isMounted) {
            setSession(currentSession);
            setUser(currentUser);
            setStatus("authenticated");
          }
        } else {
          if (isMounted) {
            setSession(null);
            setUser(null);
            setStatus("unauthenticated");
          }
        }
      } catch {
        if (isMounted) {
          setSession(null);
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }

    initAuth();

    // Step 3: Subscribe to ongoing auth state change events
    const unsubscribe = client.onAuthStateChange((event, newSession, newUser) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newUser);
      setStatus(newSession && newUser ? "authenticated" : "unauthenticated");
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      client,
      user,
      session,
      status,
      isLoading: status === "loading",
      isAuthenticated: status === "authenticated",
      login: (opts) => client.login(opts),
      signup: (opts) => client.signup(opts),
      logout: (opts) => client.logout(opts),
      refresh: () => client.refresh(),
    }),
    [client, user, session, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an <AuthProvider>");
  }
  return context;
}

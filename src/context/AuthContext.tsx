'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/types';
import { apiClient } from '@/lib/apiClient';

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, name?: string) => Promise<void>;
  signup: (
    email: string,
    name: string,
    password: string,
    plan?: 'Free' | 'Pro' | 'Enterprise'
  ) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; email: string; resetToken?: string; resetUrl?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ message: string; email: string }>;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'sanposts_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authenticate user via token verification on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const token = apiClient.getToken();

        if (token) {
          try {
            // Verify with API v1 /auth/me
            const profile = await apiClient.auth.me();
            if (isMounted && profile) {
              const fullProfile: UserProfile = {
                name: profile.name,
                email: profile.email,
                avatar: profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                plan: profile.plan || 'Pro',
                creditsUsed: profile.creditsUsed ?? 0,
                creditsTotal: profile.creditsTotal ?? 100,
                isLoggedIn: true,
              };
              setUser(fullProfile);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fullProfile));
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.warn('[AuthContext] Token expired or invalid, logging out:', err);
            apiClient.setToken(null);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }

        // If no valid token exists, user is strictly unauthenticated
        if (isMounted) {
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (e) {
        console.error('[AuthContext] Auth init error:', e);
        if (isMounted) {
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password?: string, name?: string) => {
    // Live authentication against API v1
    const res = await apiClient.auth.login(email, name, password);

    const fullProfile: UserProfile = {
      name: res.user.name,
      email: res.user.email,
      avatar: res.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      plan: res.user.plan || 'Pro',
      creditsUsed: res.user.creditsUsed ?? 0,
      creditsTotal: res.user.creditsTotal ?? 100,
      isLoggedIn: true,
    };

    setUser(fullProfile);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fullProfile));
  }, []);

  const signup = useCallback(
    async (
      email: string,
      name: string,
      password: string,
      plan?: 'Free' | 'Pro' | 'Enterprise'
    ) => {
      // Live registration against API v1
      const res = await apiClient.auth.signup(email, name,password, plan);

      const fullProfile: UserProfile = {
        name: res.user.name,
        email: res.user.email,
        avatar: res.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        plan: res.user.plan || 'Pro',
        creditsUsed: res.user.creditsUsed ?? 0,
        creditsTotal: res.user.creditsTotal ?? 100,
        isLoggedIn: true,
      };

      setUser(fullProfile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fullProfile));
    },
    []
  );

  const forgotPassword = useCallback(async (email: string) => {
    return apiClient.auth.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    return apiClient.auth.resetPassword(token, newPassword);
  }, []);

  const logout = useCallback(() => {
    apiClient.auth.logout();
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const updateUser = useCallback((data: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update user profile in storage', e);
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user?.isLoggedIn),
        isLoading,
        login,
        signup,
        forgotPassword,
        resetPassword,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

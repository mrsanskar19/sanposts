'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle, Check, Key } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Logo } from '@/components/brand/Logo';
import { apiClient } from '@/lib/apiClient';

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token') || '';

  const [token, setToken] = useState(urlToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (urlToken) {
      setToken(urlToken);
    }
  }, [urlToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const activeToken = token.trim();
    if (!activeToken) {
      setError('Please provide a valid reset token.');
      return;
    }

    if (!password || password.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.auth.resetPassword(activeToken, password);
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Invalid or expired password reset token.');
    }
  };

  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-white/90 dark:bg-zinc-950/80 backdrop-blur-2xl shadow-2xl shadow-black/30">
      <div className="flex flex-col items-center text-center mb-6">
        <Link href="/" className="mb-3">
          <Logo size="lg" showText={false} />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-foreground ">
          Set new password
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Choose a strong, unique password for your SanPosts account
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 text-red-500 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isSuccess && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Password updated successfully! Redirecting to sign in...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Reset Token */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Reset Token
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Key className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="rst_..."
              value={token}
              onChange={e => setToken(e.target.value)}
              disabled={isLoading || isSuccess}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 text-xs text-foreground font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading || isSuccess}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 text-xs text-foreground  placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500">
              <span className={`flex items-center gap-1 ${hasLength ? 'text-emerald-500' : ''}`}>
                <Check className="w-3 h-3" /> 8+ chars
              </span>
              <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-500' : ''}`}>
                <Check className="w-3 h-3" /> 1+ number
              </span>
              <span className={`flex items-center gap-1 ${hasLetter ? 'text-emerald-500' : ''}`}>
                <Check className="w-3 h-3" /> 1+ letter
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={isLoading || isSuccess}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 text-xs text-foreground  placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isSuccess}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating Password...</span>
            </>
          ) : (
            <>
              <span>Save New Password</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-zinc-950 text-foreground  overflow-y-auto">
      {/* Background image from public/bg.jpg */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/bg.jpg')` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-white/85 dark:bg-black/85 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between max-w-6xl w-full mx-auto">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-foreground dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Centered Reset Card wrapped in Suspense for useSearchParams */}
      <div className="relative z-10 flex items-center justify-center my-auto py-8">
        <Suspense fallback={
          <div className="w-full max-w-md p-8 rounded-3xl bg-white/90 dark:bg-zinc-950/80 backdrop-blur-2xl flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        }>
          <ResetPasswordFormContent />
        </Suspense>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-[11px] text-zinc-400 py-2">
        &copy; {new Date().getFullYear()} SanPosts AI Inc. Multi-Platform Social Studio.
      </div>
    </div>
  );
}

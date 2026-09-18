'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useAuth } from '@/context/AuthContext';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If already logged in, redirect to studio workspace
  useEffect(() => {
    if (isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email.trim(), password);
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Invalid email or password. Please check your credentials.');
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-white/90 dark:bg-zinc-950/80 backdrop-blur-2xl shadow-2xl shadow-black/30">
      {/* Brand & Welcome Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <Link href="/" className="mb-3 group">
          <Logo size="lg" showText={false} />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Welcome back to SanPosts AI
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Sign in to access your multi-platform social studio
        </p>
      </div>

      {/* Error / Success Feedback Alert */}
      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 text-red-500 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Signed in successfully! Redirecting to studio...</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading || success}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 text-xs text-foreground  placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading || success}
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
          <div className="mt-1.5 flex items-center justify-between">
            <p
              className={`text-[11px] flex items-center gap-1 transition-colors ${
                password.length > 0 && password.length < 6
                  ? 'text-amber-500 dark:text-amber-400 font-medium'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              Password must be at least 6 characters.
            </p>
            {password.length > 0 && (
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${
                  password.length >= 6
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                }`}
              >
                {password.length}/6
              </span>
            )}
          </div>
        </div>

        {/* Remember me checkbox */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-100 dark:bg-zinc-900"
            />
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Remember this device</span>
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || success}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to SanPosts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="mt-6 pt-5 text-center">
        <p className="text-xs text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold text-indigo-500 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

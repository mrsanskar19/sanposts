'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Logo } from '@/components/brand/Logo';
import { apiClient } from '@/lib/apiClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string>('/reset-password');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient.auth.forgotPassword(email.trim());
      setIsLoading(false);
      if (res.resetUrl) {
        setResetUrl(res.resetUrl);
      } else if (res.resetToken) {
        setResetUrl(`/reset-password?token=${res.resetToken}`);
      }
      setIsSubmitted(true);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Could not find an account with this email address.');
    }
  };

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

      {/* Centered Recovery Card */}
      <div className="relative z-10 flex items-center justify-center my-auto py-8">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white/90 dark:bg-zinc-950/80 backdrop-blur-2xl shadow-2xl shadow-black/30">
          <div className="flex flex-col items-center text-center mb-6">
            <Link href="/" className="mb-3">
              <Logo size="lg" showText={false} />
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-foreground ">
              Reset your password
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Enter your email address and we&apos;ll send you a secure link to reset your credentials.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 text-red-500 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-semibold text-foreground ">
                Recovery email sent
              </h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                If an account exists for <span className="font-semibold text-zinc-800 dark:text-zinc-200">{email}</span>, you will receive password reset instructions shortly.
              </p>
              <div className="pt-2">
                <Link
                  href={resetUrl}
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20"
                >
                  <span>Proceed to Reset Password</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 text-xs text-foreground  placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Instructions...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 text-center">
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-500 hover:text-foreground dark:hover:text-zinc-100 transition-colors"
            >
              Remember your password? <span className="text-indigo-500 hover:underline">Sign In</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-[11px] text-zinc-400 py-2">
        &copy; {new Date().getFullYear()} SanPosts AI Inc. Multi-Platform Social Studio.
      </div>
    </div>
  );
}

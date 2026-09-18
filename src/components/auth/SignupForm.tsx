'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useAuth } from '@/context/AuthContext';

export const SignupForm: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn, signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If already logged in, redirect to studio
  useEffect(() => {
    if (isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please provide a valid business or creator email.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreedTerms) {
      setError('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setIsLoading(true);

    try {
      await signup(email.trim(), fullName.trim(), password);
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Could not create account. Please check your details.');
    }
  };

  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-white/90 dark:bg-zinc-950/80 backdrop-blur-2xl shadow-2xl shadow-black/30">
      {/* Brand & Signup Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <Link href="/" className="mb-3 group">
          <Logo size="lg" showText={false} />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-foreground ">
          Create your SanPosts Studio Account
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Start planning and generating across 6+ social networks in seconds
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
          <span>Account created! Redirecting to studio workspace...</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Sanskar Tiwari"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              disabled={isLoading || success}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 text-xs text-foreground  placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Work / Creator Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              placeholder="sanskar@domain.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading || success}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 text-xs text-foreground  placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Password
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

          {/* Password strength criteria */}
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
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Confirm Password
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
              disabled={isLoading || success}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 text-xs text-foreground  placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Terms agreement */}
        <div className="pt-1">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={e => setAgreedTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-100 dark:bg-zinc-900"
            />
            <span className="text-[11px] text-zinc-500 leading-tight">
              I agree to the{' '}
              <Link href="/terms" className="underline text-indigo-500 hover:text-indigo-400">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline text-indigo-500 hover:text-indigo-400">
                Privacy Policy
              </Link>.
            </span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || success}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-5 pt-4 text-center">
        <p className="text-xs text-zinc-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-indigo-500 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

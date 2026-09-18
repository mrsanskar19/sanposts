import React from 'react';
import Link from 'next/link';
import { SignupForm } from '@/components/auth/SignupForm';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export const metadata = {
  title: 'Sign Up | SanPosts AI',
  description: 'Create your SanPosts AI workspace account and generate 4-platform social campaigns with AI.',
};

export default function SignupPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-zinc-100 dark:bg-zinc-950 text-foreground  overflow-y-auto">
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

      {/* Top bar with theme toggle (Back to Studio button removed as requested) */}
      <div className="relative z-10 flex items-center justify-end max-w-6xl w-full mx-auto">
        <ThemeToggle />
      </div>

      {/* Centered Signup Card */}
      <div className="relative z-10 flex items-center justify-center my-auto py-8">
        <SignupForm />
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-[11px] text-zinc-400 py-2">
        &copy; {new Date().getFullYear()} SanPosts AI Inc. Multi-Platform Social Studio.
      </div>
    </div>
  );
}

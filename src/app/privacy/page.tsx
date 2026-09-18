import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Logo } from '@/components/brand/Logo';

export const metadata = {
  title: 'Privacy Policy | SanPosts AI',
  description: 'Privacy policy and data handling guidelines for SanPosts AI platform.',
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-8 bg-zinc-950 text-foreground  overflow-y-auto">
      {/* Background image from public/bg.jpg */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/bg.jpg')` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-white/90 dark:bg-black/90 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between max-w-4xl w-full mx-auto mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-foreground dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Studio</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-4xl w-full mx-auto my-auto p-8 sm:p-12 rounded-3xl bg-white/80 dark:bg-zinc-950/70 backdrop-blur-2xl shadow-2xl shadow-black/20">
        <div className="mb-6 flex items-center gap-3">
          <Logo size="md" showText={false} />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground dark:text-zinc-50">
              Privacy Policy
            </h1>
            <p className="text-xs text-zinc-500">Last updated: September 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-sm font-bold text-foreground  mb-2">
              1. Information We Collect
            </h2>
            <p>
              We collect information provided directly when configuring your brand persona, saving post drafts, uploading brand visual assets, and authenticating social network integrations.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-foreground  mb-2">
              2. How Your Data Is Processed
            </h2>
            <p>
              Uploaded brand assets and campaign briefs are processed strictly for real-time post formulation. We do not sell or distribute your private draft contents to third-party advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-foreground  mb-2">
              3. Data Retention & Workspace Control
            </h2>
            <p>
              You maintain complete control over your saved posts and brand imagery. Deleting saved posts from your Content Library immediately purges them from platform storage.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-[11px] text-zinc-400 py-6">
        &copy; {new Date().getFullYear()} SanPosts AI Inc. Multi-Platform Social Studio.
      </div>
    </div>
  );
}

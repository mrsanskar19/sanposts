'use client';

import React from 'react';
import { SocialPlatform } from '@/types';

interface SkeletonPostCardProps {
  platform: SocialPlatform;
}

export const SkeletonPostCard: React.FC<SkeletonPostCardProps> = ({ platform }) => {
  return (
    <div
      aria-label={`Loading ${platform} post`}
      className="flex flex-col rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden animate-pulse"
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-20 h-3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="w-14 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Image box skeleton */}
      <div className="w-full aspect-video sm:h-48 bg-zinc-200/70 dark:bg-zinc-800/50" />

      {/* Description lines skeleton */}
      <div className="p-4 space-y-2.5">
        <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="w-5/6 h-3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="w-4/6 h-3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Hashtags skeleton */}
      <div className="px-4 pb-4 pt-1 flex gap-2">
        <div className="w-16 h-3 rounded-md bg-zinc-200/80 dark:bg-zinc-800/70" />
        <div className="w-14 h-3 rounded-md bg-zinc-200/80 dark:bg-zinc-800/70" />
      </div>
    </div>
  );
};

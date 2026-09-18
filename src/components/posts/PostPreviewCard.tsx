'use client';

import React, { useState } from 'react';
import { PostPreview, SocialPlatform } from '@/types';
import { Copy, Check, Bookmark, BookmarkCheck, Maximize2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface PostPreviewCardProps {
  post: PostPreview;
  onToggleSave?: (post: PostPreview) => void;
  onOpenDetail?: (post: PostPreview) => void;
}

const platformMeta: Record<
  SocialPlatform,
  { name: string; icon: string; bg: string; text: string; border: string }
> = {
  instagram: {
    name: 'Instagram',
    icon: '📸',
    bg: 'bg-pink-50 dark:bg-pink-950/40',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800/60',
  },
  twitter: {
    name: 'X (Twitter)',
    icon: '𝕏',
    bg: 'bg-zinc-100 dark:bg-zinc-800/60',
    text: 'text-zinc-800 dark:text-zinc-200',
    border: 'border-zinc-300 dark:border-zinc-700',
  },
  facebook: {
    name: 'Facebook',
    icon: '👥',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800/60',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800/60',
  },
  reddit: {
    name: 'Reddit',
    icon: '🤖',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800/60',
  },
  blog: {
    name: 'Blog / Article',
    icon: '📝',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/60',
  },
  threads: {
    name: 'Threads',
    icon: '🧵',
    bg: 'bg-zinc-100 dark:bg-zinc-800/60',
    text: 'text-zinc-800 dark:text-zinc-200',
    border: 'border-zinc-300 dark:border-zinc-700',
  },
  newsletter: {
    name: 'Newsletter',
    icon: '📬',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/60',
  },
  medium: {
    name: 'Medium',
    icon: '📖',
    bg: 'bg-zinc-100 dark:bg-zinc-800/60',
    text: 'text-zinc-800 dark:text-zinc-200',
    border: 'border-zinc-300 dark:border-zinc-700',
  },
};

export const PostPreviewCard: React.FC<PostPreviewCardProps> = ({
  post,
  onToggleSave,
  onOpenDetail,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);

  const meta = platformMeta[post.platform] || {
    name: post.platform,
    icon: '📱',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-800 dark:text-zinc-200',
    border: 'border-zinc-300 dark:border-zinc-700',
  };

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const fullText = `${post.content}\n\n${post.hashtags.join(' ')}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      showToast(`${meta.name} post content copied!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      showToast('Failed to copy post text', 'error');
    }
  };

  const handleSave = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    onToggleSave?.({ ...post, isSaved: nextSaved });
    showToast(nextSaved ? 'Saved to content library' : 'Removed from library', 'info');
  };

  return (
    <div
      onClick={() => onOpenDetail?.(post)}
      className="group flex flex-col rounded-lg sm:rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden transition-all hover:shadow-md cursor-pointer hover:border-indigo-400/60 dark:hover:border-indigo-500/60"
    >
      {/* Top Header: Platform + Actions */}
      <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <span className="text-base">{meta.icon}</span>
          <span className="text-xs font-bold text-foreground ">
            {meta.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenDetail && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(post);
              }}
              title="View full detail"
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            title={isSaved ? 'Saved in Library' : 'Save to Library'}
            className={`p-1.5 rounded-md transition-colors ${isSaved
              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
              : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
          >
            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${copied
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. Image (Uploaded image or asset) */}
      {post.imageUrl && (
        <div className="relative w-full aspect-video sm:h-44 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={`${meta.name} post media`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 2. Description (Post Content) */}
      <div className="p-3 sm:p-3.5 flex-1">
        <div className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
          {post.content}
        </div>
      </div>

      {/* 3. Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="px-3 pb-3 pt-1 sm:px-3.5 sm:pb-3.5 flex flex-wrap gap-1.5 border-t border-zinc-50 dark:border-zinc-800/40">
          {post.hashtags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

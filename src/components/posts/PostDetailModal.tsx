'use client';

import React, { useState } from 'react';
import { PostPreview } from '@/types';
import {
  X,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Share2,
  Calendar,
  Hash,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface PostDetailModalProps {
  post: PostPreview | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSave?: (post: PostPreview) => void;
  onSchedulePost?: (post: PostPreview) => void;
}

const platformIcons: Record<string, string> = {
  instagram: '📸',
  twitter: '𝕏',
  facebook: '👥',
  linkedin: '💼',
  reddit: '🤖',
  blog: '📝',
  threads: '🧵',
  newsletter: '📬',
  medium: '✍️',
};

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  onToggleSave,
  onSchedulePost,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !post) return null;

  const handleCopy = async () => {
    try {
      const fullText = `${post.content}\n\n${post.hashtags.join(' ')}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      showToast('Post content copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy text', 'error');
    }
  };

  const handleToggleBookmark = () => {
    const nextSaved = !post.isSaved;
    onToggleSave?.({ ...post, isSaved: nextSaved });
    showToast(nextSaved ? 'Saved to content library' : 'Removed from saved posts', 'info');
  };

  const charCount = post.content.length;
  const wordCount = post.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl h-full max-h-[92dvh] sm:max-h-[88vh] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl rounded-lg sm:rounded-xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col border border-zinc-200/80 dark:border-zinc-800/80"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg sm:text-xl">{platformIcons[post.platform] || '📱'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-base font-bold text-foreground capitalize truncate max-w-[200px] sm:max-w-none">
                  {post.platform} Post Preview & Details
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  {post.platform}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Full-fidelity preview, editorial copy, and hashtag analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`p-1.5 rounded-md transition-colors ${post.isSaved
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              title={post.isSaved ? 'Saved in library' : 'Save to library'}
            >
              {post.isSaved ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Responsive Two Columns / Stack on Mobile */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden">
          {/* Left Column: Media & Post Card Mockup */}
          <div className="w-full md:w-1/2 p-3 sm:p-5 md:p-6 md:overflow-y-auto custom-scrollbar border-b md:border-b-0 md:border-r border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/30 dark:bg-zinc-900/10 flex flex-col gap-4">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Platform Mockup
            </div>

            {/* Simulated Mobile Platform Card */}
            <div className="rounded-lg sm:rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-sm overflow-hidden flex flex-col">
              {/* Card Meta */}
              <div className="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    SP
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground ">
                      SanPosts Creator
                    </div>
                    <div className="text-[10px] text-zinc-400">@sanposts &bull; Just now</div>
                  </div>
                </div>
                <span className="text-xs">{platformIcons[post.platform] || '📱'}</span>
              </div>

              {/* Media Asset */}
              {post.imageUrl && (
                <div className="relative w-full aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.imageUrl}
                    alt="Post Asset"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Card Text */}
              <div className="p-3.5 space-y-2">
                <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {post.hashtags.map((h, i) => (
                      <span key={i} className="text-[11px] font-medium text-indigo-500">
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <div className="p-3 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Characters</div>
                <div className="text-base font-extrabold text-foreground  mt-0.5">
                  {charCount}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Words</div>
                <div className="text-base font-extrabold text-foreground  mt-0.5">
                  {wordCount}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Copy editor, hashtags & actions */}
          <div className="md:w-1/2 p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Full Content & Copy
                  </label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                </div>
                <div className="p-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed border border-zinc-200/70 dark:border-zinc-800/70">
                  {post.content}
                </div>
              </div>

              {/* Hashtag breakdown */}
              {post.hashtags.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Included Hashtags ({post.hashtags.length})</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {post.hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200/70 dark:border-zinc-800/70">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-md text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>

              {onSchedulePost && (
                <button
                  type="button"
                  onClick={() => {
                    onSchedulePost(post);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 text-foreground  hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Send to Schedule</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy All'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

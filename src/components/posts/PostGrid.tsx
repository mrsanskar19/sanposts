'use client';

import React, { useState } from 'react';
import { PostPreview, SocialPlatform } from '@/types';
import { PostPreviewCard } from './PostPreviewCard';
import { SkeletonPostCard } from './SkeletonPostCard';
import { Copy, Check, Sparkles } from 'lucide-react';

interface PostGridProps {
  posts: PostPreview[];
  isLoading: boolean;
  activePlatforms?: SocialPlatform[];
  onToggleSave?: (post: PostPreview) => void;
  onOpenDetail?: (post: PostPreview) => void;
}

export const PostGrid: React.FC<PostGridProps> = ({
  posts,
  isLoading,
  activePlatforms = ['instagram', 'twitter', 'facebook', 'linkedin'],
  onToggleSave,
  onOpenDetail,
}) => {
  const [allCopied, setAllCopied] = useState(false);

  const handleCopyAll = async () => {
    try {
      const bundle = posts
        .map(p => `--- ${p.platform.toUpperCase()} ---\n${p.content}\n\n${p.hashtags.join(' ')}`)
        .join('\n\n====================\n\n');

      await navigator.clipboard.writeText(bundle);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    } catch {
      setAllCopied(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 my-2">
      {/* Action Header */}
      {!isLoading && posts.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Generated {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              allCopied
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white shadow-xs'
            }`}
          >
            {allCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>All Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All Posts</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          activePlatforms.map((plat, idx) => (
            <SkeletonPostCard key={`skeleton-${plat}-${idx}`} platform={plat} />
          ))
        ) : (
          posts.map(post => (
            <PostPreviewCard
              key={post.id}
              post={post}
              onToggleSave={onToggleSave}
              onOpenDetail={onOpenDetail}
            />
          ))
        )}
      </div>
    </div>
  );
};

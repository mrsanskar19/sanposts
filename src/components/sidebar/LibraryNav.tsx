'use client';

import React, { useState } from 'react';
import { Bookmark, Building2, Image as ImageIcon, ChevronDown, ChevronRight, Folder } from 'lucide-react';

interface LibraryNavProps {
  onOpenLibrary: (tab: 'saved' | 'brand' | 'images') => void;
  savedCount?: number;
}

export const LibraryNav: React.FC<LibraryNavProps> = ({ onOpenLibrary, savedCount = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="py-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5 opacity-70" />
          <span>Library</span>
        </span>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-1 space-y-0.5 px-1">
          {/* Saved Posts */}
          <button
            type="button"
            onClick={() => onOpenLibrary('saved')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-foreground dark:hover:text-zinc-200 transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <Bookmark className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span>Saved Posts</span>
            </div>
            {savedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                {savedCount}
              </span>
            )}
          </button>

          {/* Brand Details */}
          <button
            type="button"
            onClick={() => onOpenLibrary('brand')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-foreground dark:hover:text-zinc-200 transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <Building2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span>Brand Details</span>
            </div>
          </button>

          {/* Brand Images */}
          <button
            type="button"
            onClick={() => onOpenLibrary('images')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-foreground dark:hover:text-zinc-200 transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <ImageIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span>Brand Images</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

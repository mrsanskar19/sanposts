'use client';

import React, { useState } from 'react';
import { SocialPlatform } from '@/types';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Share2,
} from 'lucide-react';

interface PlatformSelectorProps {
  onConfirm: (selectedPlatforms: SocialPlatform[]) => void;
  isLoading?: boolean;
}

interface PlatformOption {
  id: SocialPlatform;
  label: string;
  icon: string;
  category: 'primary' | 'more';
}

const allPlatformOptions: PlatformOption[] = [
  { id: 'instagram', label: 'Instagram', icon: '📸', category: 'primary' },
  { id: 'twitter', label: 'X (Twitter)', icon: '𝕏', category: 'primary' },
  { id: 'facebook', label: 'Facebook', icon: '👥', category: 'primary' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', category: 'primary' },
  { id: 'reddit', label: 'Reddit', icon: '🤖', category: 'primary' },
  { id: 'blog', label: 'Blog / Article', icon: '📝', category: 'primary' },
  { id: 'threads', label: 'Threads', icon: '🧵', category: 'more' },
  { id: 'newsletter', label: 'Newsletter', icon: '📬', category: 'more' },
  { id: 'medium', label: 'Medium', icon: '📖', category: 'more' },
];

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({ onConfirm, isLoading = false }) => {
  const [selected, setSelected] = useState<SocialPlatform[]>([
    'instagram',
    'twitter',
    'facebook',
    'linkedin',
  ]);
  const [showMore, setShowMore] = useState(false);

  const togglePlatform = (id: SocialPlatform) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const list = showMore
      ? allPlatformOptions.map(p => p.id)
      : allPlatformOptions.filter(p => p.category === 'primary').map(p => p.id);
    setSelected(list);
  };

  const handleClear = () => {
    setSelected([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length > 0 && !isLoading) {
      onConfirm(selected);
    }
  };

  const primaryPlatforms = allPlatformOptions.filter(p => p.category === 'primary');
  const morePlatforms = allPlatformOptions.filter(p => p.category === 'more');

  return (
    <div className="w-full max-w-2xl p-3.5 sm:p-4 rounded-lg sm:rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground ">
              Where do you want to publish this post?
            </h4>
            <p className="text-[11px] text-zinc-500">
              Choose the platforms you want to build tailored posts for:
            </p>
          </div>
        </div>

        {/* Quick select / clear */}
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-zinc-500 hover:text-foreground dark:hover:text-zinc-100 font-medium transition-colors"
          >
            Select all
          </button>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-zinc-500 hover:text-foreground dark:hover:text-zinc-100 font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main Platform Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-3">
        {primaryPlatforms.map(platform => {
          const isChecked = selected.includes(platform.id);

          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => togglePlatform(platform.id)}
              className={`flex items-center justify-between p-2 sm:p-2.5 rounded-md sm:rounded-lg border text-xs font-semibold transition-all ${isChecked
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-900 dark:border-white shadow-xs'
                : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{platform.icon}</span>
                <span>{platform.label}</span>
              </div>
              <div
                className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border text-[10px] transition-colors ${isChecked
                  ? 'bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white border-transparent'
                  : 'border-zinc-300 dark:border-zinc-600'
                  }`}
              >
                {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* More Options Expandable */}
      {showMore && (
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in duration-200">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Additional Channels
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {morePlatforms.map(platform => {
              const isChecked = selected.includes(platform.id);

              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={`flex items-center justify-between p-2 sm:p-2.5 rounded-md sm:rounded-lg border text-xs font-semibold transition-all ${isChecked
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-900 dark:border-white shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{platform.icon}</span>
                    <span>{platform.label}</span>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border text-[10px] transition-colors ${isChecked
                      ? 'bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white border-transparent'
                      : 'border-zinc-300 dark:border-zinc-600'
                      }`}
                  >
                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer controls: Show More Toggle & Generate Button */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          {showMore ? (
            <>
              <span>Fewer options</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>Show more options (Threads, Newsletter, Medium)</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        <button
          type="button"
          disabled={selected.length === 0 || isLoading}
          onClick={handleSubmit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Generate {selected.length} {selected.length === 1 ? 'Post' : 'Posts'}</span>
        </button>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = false, className = '' }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`flex items-center gap-1 p-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80 border border-zinc-300/60 dark:border-zinc-700/60 text-xs font-medium backdrop-blur-sm ${className}`}>
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-label="Light mode"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${theme === 'light'
          ? 'bg-white text-foreground shadow-sm font-semibold'
          : 'text-zinc-600 dark:text-zinc-400 hover:text-foreground dark:hover:text-zinc-200'
          }`}
      >
        <Sun className="w-3.5 h-3.5" />
        {showLabel && <span>Light</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-label="Dark mode"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${theme === 'dark'
          ? 'bg-zinc-900 text-zinc-100 shadow-sm font-semibold'
          : 'text-zinc-600 dark:text-zinc-400 hover:text-foreground dark:hover:text-zinc-200'
          }`}
      >
        <Moon className="w-3.5 h-3.5" />
        {showLabel && <span>Dark</span>}
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        aria-label="System mode"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${theme === 'system'
          ? 'bg-white dark:bg-zinc-900 text-foreground  shadow-sm font-semibold'
          : 'text-zinc-600 dark:text-zinc-400 hover:text-foreground dark:hover:text-zinc-200'
          }`}
      >
        <Laptop className="w-3.5 h-3.5" />
        {showLabel && <span>System</span>}
      </button>
    </div>
  );
};

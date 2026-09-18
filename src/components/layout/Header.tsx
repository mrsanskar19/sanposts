'use client';

import React from 'react';
import { Menu, Search } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenSearch?: () => void;
  onNewPlan?: () => void;
  onOpenSettings?: () => void;
  activeTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenSearch,
  activeTitle = 'New Social Plan',
}) => {
  return (
    <header className="h-12 sm:h-14 shrink-0 flex items-center justify-between md:justify-center px-3 sm:px-4 bg-transparent border-none shadow-none z-30 relative">
      {/* Mobile Menu Button on left */}
      <div className="flex items-center md:hidden">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Open navigation menu"
          className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Active Conversation Title */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[55vw] sm:max-w-md text-center cursor-pointer"
        title="Active conversation"
      >
        {activeTitle}
      </button>

      {/* Mobile Search Button on right */}
      <div className="flex items-center md:hidden">
        <button
          type="button"
          onClick={onOpenSearch || onToggleSidebar}
          aria-label="Search chats"
          className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
          title="Search chats"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};


'use client';

import React from 'react';
import { Conversation, UserProfile } from '@/types';
import { Plus, X, Calendar } from 'lucide-react';
import Link from 'next/link';
import { LibraryNav } from '../sidebar/LibraryNav';
import { ChatHistory } from '../sidebar/ChatHistory';
import { ProfileMenu } from '../sidebar/ProfileMenu';
import { Logo } from '../brand/Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewPlan: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onOpenSettings: () => void;
  onOpenLibrary: (tab: 'saved' | 'brand' | 'images') => void;
  savedCount: number;
  user: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onNewPlan,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onOpenSettings,
  onOpenLibrary,
  savedCount,
  user,
}) => {
  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0  bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Shell - Fixed position for desktop, drawer for mobile */}
      <aside
        className={`fixed inset-y-0 left-0 flex flex-col w-72 h-screen md:h-[calc(100vh-1.5rem)] md:top-3 md:left-3 md:rounded-xl overflow-hidden bg-[url('/bg.jpg')] bg-cover bg-center transition-transform duration-300 ease-in-out shadow-2xl shadow-black/20 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Inner frosted glass overlay */}
        <div className="absolute inset-0 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-2xl -z-10 pointer-events-none" />

        {/* Top Header & Brand Logo */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-black/5 dark:border-white/5">
          <Logo size="md" showText={true} />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-md text-zinc-400 hover:text-foreground dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: + New Plan */}
        <div className="p-3 pb-2">
          <button
            type="button"
            onClick={() => {
              onNewPlan();
              if (window.innerWidth < 768) {
                onClose();
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>New Social Plan</span>
          </button>
        </div>

        {/* Schedules Calendar Navigation */}
       

        {/* Library Navigation */}
        <div className="px-2">
          <LibraryNav
            onOpenLibrary={(tab) => {
              onOpenLibrary(tab);
              if (window.innerWidth < 768) {
                onClose();
              }
            }}
            savedCount={savedCount}
          />
        </div>

        {/* Scrollable Chat History */}
        <div className="flex-1 min-h-0 flex flex-col">
          <ChatHistory
            conversations={conversations}
            activeId={activeConversationId}
            onSelectConversation={(id) => {
              onSelectConversation(id);
              if (window.innerWidth < 768) {
                onClose();
              }
            }}
            onDeleteConversation={onDeleteConversation}
          />
        </div>

        {/* Legal and Auth Links Footer */}
        <div className="px-4 py-1.5 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
          <div className="flex items-center gap-2">
            <Link href="/terms" className="hover:underline hover:text-zinc-700 dark:hover:text-zinc-300">Terms</Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:underline hover:text-zinc-700 dark:hover:text-zinc-300">Privacy</Link>
          </div>
          {!user?.isLoggedIn && (
            <Link href="/login" className="hover:underline hover:text-zinc-700 dark:hover:text-zinc-300">Sign in</Link>
          )}
        </div>

        {/* Fixed User Profile at bottom */}
        <ProfileMenu user={user} onOpenSettings={onOpenSettings} />
      </aside>
    </>
  );
};

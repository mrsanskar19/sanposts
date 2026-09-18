'use client';

import React, { useState } from 'react';
import { BrandAsset, BrandDetails, Conversation, PostPreview, UserProfile } from '@/types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SettingsModal } from '../settings/SettingsModal';
import { LibraryModal } from '../library/LibraryModal';

interface AppShellProps {
  children: React.ReactNode;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onClearAllChats?: () => void;
  onNewPlan: () => void;
  user: UserProfile;
  activeTitle?: string;
  savedPosts: PostPreview[];
  onDeleteSavedPost: (id: string) => void;
  brandDetails: BrandDetails;
  onUpdateBrandDetails: (details: BrandDetails) => void;
  brandImages: BrandAsset[];
  onUseImageInChat?: (imageUrl: string) => void;
  onOpenDetail?: (post: PostPreview) => void;
  onOpenAIImageAnalysis?: (imageUrl: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onClearAllChats,
  onNewPlan,
  user,
  activeTitle,
  savedPosts,
  onDeleteSavedPost,
  brandDetails,
  onUpdateBrandDetails,
  brandImages,
  onUseImageInChat,
  onOpenDetail,
  onOpenAIImageAnalysis,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<string>('general');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryTab, setLibraryTab] = useState<'saved' | 'brand' | 'images'>('saved');

  // Modal URL Search Params synchronization
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const m = currentParams.get('modal');
      const t = currentParams.get('tab');
      setIsSettingsOpen(m === 'settings');
      if (t) setSettingsTab(t);
      setIsLibraryOpen(m === 'library');
      if (t === 'saved' || t === 'brand' || t === 'images') {
        setLibraryTab(t);
      }
    };

    // Schedule initial check in next tick
    const timer = setTimeout(handlePopState, 0);

    window.addEventListener('popstate', handlePopState);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleOpenSettings = (tab = 'general') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
    setIsLibraryOpen(false);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('modal', 'settings');
      params.set('tab', tab);
      window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('modal') === 'settings') {
        params.delete('modal');
        params.delete('tab');
        const search = params.toString() ? `?${params.toString()}` : '';
        window.history.pushState(null, '', `${window.location.pathname}${search}`);
      }
    }
  };

  const handleOpenLibrary = (tab: 'saved' | 'brand' | 'images') => {
    setLibraryTab(tab);
    setIsLibraryOpen(true);
    setIsSettingsOpen(false);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('modal', 'library');
      params.set('tab', tab);
      window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  };

  const handleCloseLibrary = () => {
    setIsLibraryOpen(false);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('modal') === 'library') {
        params.delete('modal');
        params.delete('tab');
        const search = params.toString() ? `?${params.toString()}` : '';
        window.history.pushState(null, '', `${window.location.pathname}${search}`);
      }
    }
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] overflow-hidden flex bg-zinc-950 text-foreground  selection:bg-indigo-600 selection:text-white">
      {/* Site-wide Background Image from public/bg.jpg */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{
          backgroundImage: `url('/bg.jpg')`,
        }}
        aria-hidden="true"
      />

      {/* Adaptive Neutral & Dark Overlay for high contrast & readability */}
      <div
        className="pointer-events-none absolute inset-0 bg-white/85 dark:bg-black/85 backdrop-blur-[2px] transition-colors duration-500"
        aria-hidden="true"
      />

      {/* Left Sidebar (Floating island with background image) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewPlan={onNewPlan}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onDeleteConversation={onDeleteConversation}
        onOpenSettings={() => handleOpenSettings('general')}
        onOpenLibrary={handleOpenLibrary}
        savedCount={savedPosts.length}
        user={user}
      />

      {/* Main Content Area (Fixed sidebar width 18rem + 1rem padding = 19rem) */}
      <div className="relative z-10 flex-1 flex flex-col h-full min-w-0 overflow-hidden md:ml-[19rem]">
        {/* Top Header (With mobile menu and search triggers) */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenSearch={() => setIsSidebarOpen(true)}
          onNewPlan={onNewPlan}
          onOpenSettings={() => handleOpenSettings('general')}
          activeTitle={activeTitle}
        />

        {/* Main Viewport */}
        <main className="flex-1 flex flex-col h-[calc(100%)] min-h-0 overflow-hidden">
          {children}
        </main>
      </div>

      {/* Settings Modal with URL query sync and multi-model/password/clear support */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        user={user}
        defaultTab={settingsTab}
        onTabChange={(tab) => {
          setSettingsTab(tab);
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            params.set('modal', 'settings');
            params.set('tab', tab);
            window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
          }
        }}
        onClearAllChats={onClearAllChats}
      />

      {/* Content Library Modal with URL query sync */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={handleCloseLibrary}
        defaultTab={libraryTab}
        onTabChange={(tab) => {
          setLibraryTab(tab);
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            params.set('modal', 'library');
            params.set('tab', tab);
            window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
          }
        }}
        savedPosts={savedPosts}
        onDeleteSavedPost={onDeleteSavedPost}
        brandDetails={brandDetails}
        onUpdateBrandDetails={onUpdateBrandDetails}
        brandImages={brandImages}
        onUseImageInChat={onUseImageInChat}
        onOpenDetail={onOpenDetail}
        onOpenAIImageAnalysis={onOpenAIImageAnalysis}
      />
    </div>
  );
};

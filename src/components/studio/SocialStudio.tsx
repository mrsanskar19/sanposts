'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyChatState } from '@/components/chat/EmptyChatState';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { AlertModal } from '@/components/common/AlertModal';
import { PostDetailModal } from '@/components/posts/PostDetailModal';
import { AIImageAnalysisModal } from '@/components/ai/AIImageAnalysisModal';
import {
  mockConversations,
} from '@/data/mockData';
import {
  BrandAsset,
  BrandDetails,
  ChatMessage,
  Conversation,
  MediaAttachment,
  PostPreview,
  SocialPlatform,
  UserProfile,
} from '@/types';
import { useAuth } from '@/modules/auth';
import { useToast } from '@/context/ToastContext';
import { apiClient } from '@/lib/apiClient';

interface SocialStudioProps {
  initialConversationId?: string | null;
}

export const SocialStudio: React.FC<SocialStudioProps> = ({
  initialConversationId = null,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user: authUser, isAuthenticated: isLoggedIn, isLoading: authLoading } = useAuth();

  // Redirect to /login if unauthenticated and not loading
  React.useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [authLoading, isLoggedIn, router]);
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sanposts_conversations');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored conversations', e);
      }
    }
    return mockConversations;
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialConversationId && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sanposts_conversations');
        if (stored) {
          const parsed: Conversation[] = JSON.parse(stored);
          const found = parsed.find(c => c.id === initialConversationId);
          if (found) return found.messages;
        }
      } catch (e) {
        console.error('Failed to parse messages from stored conversations', e);
      }
    }
    return [];
  });
  const [activePrompt, setActivePrompt] = useState<string>('');
  const [activeAttachedImage, setActiveAttachedImage] = useState<string | undefined>(undefined);
  const [activeAttachments, setActiveAttachments] = useState<BrandAsset[] | undefined>(undefined);
  const [activePlatforms, setActivePlatforms] = useState<SocialPlatform[]>([
    'instagram',
    'twitter',
    'facebook',
    'linkedin',
  ]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const userProfile: UserProfile | any = authUser

  // Library State initialized without mock data
  const [savedPosts, setSavedPosts] = useState<PostPreview[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sanposts_saved_posts');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse saved posts', e);
      }
    }
    return [];
  });
  const [brandDetails, setBrandDetails] = useState<BrandDetails>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sanposts_brand_details');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse brand details', e);
      }
    }
    return {
      brandName: '',
      tagline: '',
      toneOfVoice: '',
      targetAudience: '',
      defaultHashtags: [],
    };
  });
  const [brandImages, setBrandImages] = useState<BrandAsset[]>([]);

  // Hydrate library state from API v1
  React.useEffect(() => {
    if (!isLoggedIn) return;

    let isMounted = true;
    async function loadLibrary() {
      try {
        const [savedRes, brandRes, assetsRes] = await Promise.allSettled([
          apiClient.library.getSavedPosts(),
          apiClient.library.getBrandDetails(),
          apiClient.library.getBrandAssets(),
        ]);

        if (!isMounted) return;

        if (savedRes.status === 'fulfilled' && savedRes.value.posts) {
          setSavedPosts(savedRes.value.posts);
          localStorage.setItem('sanposts_saved_posts', JSON.stringify(savedRes.value.posts));
        }

        if (brandRes.status === 'fulfilled' && brandRes.value) {
          setBrandDetails(brandRes.value);
          localStorage.setItem('sanposts_brand_details', JSON.stringify(brandRes.value));
        }

        if (assetsRes.status === 'fulfilled' && assetsRes.value.assets) {
          setBrandImages(assetsRes.value.assets);
        }
      } catch (err) {
        console.warn('[SocialStudio] Error loading library data:', err);
      }
    }

    loadLibrary();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  // Active detailed post modal state
  const [activeDetailPost, setActiveDetailPost] = useState<PostPreview | null>(null);

  // AI Vision Image Analysis modal state
  const [isAIAnalysisModalOpen, setIsAIAnalysisModalOpen] = useState(false);
  const [aiAnalysisInitialImage, setAiAnalysisInitialImage] = useState<string | undefined>(undefined);

  // Track previous initialConversationId to adjust state during render (React recommended pattern)
  const [prevInitialId, setPrevInitialId] = useState<string | null>(initialConversationId);

  if (prevInitialId !== initialConversationId) {
    setPrevInitialId(initialConversationId);
    if (initialConversationId) {
      const found = conversations.find(c => c.id === initialConversationId);
      if (found) {
        setActiveConversationId(initialConversationId);
        setMessages(found.messages);
      }
    } else {
      setActiveConversationId(null);
      setMessages([]);
    }
  }

  // Persist conversations to localStorage whenever changed
  const updateConversationsAndStorage = (updater: Conversation[] | ((prev: Conversation[]) => Conversation[])) => {
    setConversations(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('sanposts_conversations', JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save conversations to localStorage', e);
        }
      }
      return next;
    });
  };

  // Persist saved posts to localStorage
  const updateSavedPostsAndStorage = (updater: PostPreview[] | ((prev: PostPreview[]) => PostPreview[])) => {
    setSavedPosts(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('sanposts_saved_posts', JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save posts to localStorage', e);
        }
      }
      return next;
    });
  };

  const handleUpdateBrandDetails = (details: BrandDetails) => {
    setBrandDetails(details);
    apiClient.library.updateBrandDetails(details).catch(err => {
      console.warn('Failed to sync brand details with API:', err);
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sanposts_brand_details', JSON.stringify(details));
      } catch (e) {
        console.error('Failed to save brand details to localStorage', e);
      }
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const headerTitle = activeConversation
    ? activeConversation.title
    : messages.length > 0
    ? 'Social Post Studio'
    : 'New Social Plan';

  // Reset to brand new plan
  const handleNewPlan = () => {
    setActiveConversationId(null);
    setMessages([]);
    setActivePrompt('');
    setActiveAttachedImage(undefined);
    setIsLoadingPosts(false);
    setInputValue('');
    router.push('/');
  };

  // Load an existing conversation from history
  const handleSelectConversation = (id: string) => {
    const found = conversations.find(c => c.id === id);
    if (!found) return;

    setActiveConversationId(id);
    setMessages(found.messages);
    setIsLoadingPosts(false);
  };

  // Deletion state for AlertModal
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  // Trigger conversation deletion confirmation
  const handleDeleteConversation = (id: string) => {
    setConversationToDelete(id);
  };

  const confirmDeleteConversation = () => {
    if (conversationToDelete) {
      updateConversationsAndStorage(prev => prev.filter(c => c.id !== conversationToDelete));
      if (activeConversationId === conversationToDelete) {
        handleNewPlan();
      }
      setConversationToDelete(null);
    }
  };

  // Clear all conversations (from Settings danger zone)
  const handleClearAllChats = () => {
    updateConversationsAndStorage([]);
    setActiveConversationId(null);
    setMessages([]);
    setActivePrompt('');
    setActiveAttachedImage(undefined);
    setActiveAttachments(undefined);
    setIsLoadingPosts(false);
    setInputValue('');
    router.push('/');
  };

  // Step 1: User sends their prompt (with optional uploaded image / media attachments)
  const handleSendMessage = (
    text: string,
    attachedImage?: string,
    attachments?: BrandAsset[] | MediaAttachment[]
  ) => {
    const trimmed = text.trim();
    if (!trimmed && !attachedImage && (!attachments || attachments.length === 0)) return;

    const currentPrompt = trimmed || 'Campaign Visual Asset';
    setActivePrompt(currentPrompt);
    if (attachedImage) {
      setActiveAttachedImage(attachedImage);
    }
    if (attachments && attachments.length > 0) {
      // Keep attachments state
      setActiveAttachments(attachments as BrandAsset[]);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentPrompt,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedImage: attachedImage,
      attachments: attachments as MediaAttachment[],
    };

    // Assistant message prompting for destination platforms
    const assistantMsg: ChatMessage = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: 'Where do you want to publish this post? Choose your target platforms below:',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      showPlatformSelector: true,
    };

    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);
    setInputValue('');

    // Ensure conversation exists in history with unique slug
    const conversationTitle =
      currentPrompt.length > 34 ? `${currentPrompt.slice(0, 34)}...` : currentPrompt;

    if (!activeConversationId) {
      const newId = `conv-${Date.now()}`;
      const newConv: Conversation = {
        id: newId,
        title: conversationTitle,
        dateCategory: 'today',
        updatedAt: 'Just now',
        messages: newMessages,
      };
      updateConversationsAndStorage(prev => [newConv, ...prev]);
      setActiveConversationId(newId);
      // Seamlessly sync URL slug to /chat/[newId]
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', `/chat/${newId}`);
      }
    } else {
      updateConversationsAndStorage(prev =>
        prev.map(c =>
          c.id === activeConversationId
            ? { ...c, messages: newMessages, updatedAt: 'Just now' }
            : c
        )
      );
    }
  };

  // Step 2: User confirms destination platforms -> build posts!
  const handleConfirmPlatforms = async (selectedPlatforms: SocialPlatform[]) => {
    setActivePlatforms(selectedPlatforms);
    setIsLoadingPosts(true);

    // Hide selector on the asking message
    setMessages(prev =>
      prev.map(msg => (msg.showPlatformSelector ? { ...msg, showPlatformSelector: false } : msg))
    );

    try {
      // Dispatch through API v1 Chat & Multi-Provider AI Engine with attached image & brand details
      const chatRes = await apiClient.chats.sendMessage(
        activePrompt,
        selectedPlatforms,
        undefined, // model
        activeAttachedImage,
        brandDetails
      );

      const postResultMsg: ChatMessage = {
        id: chatRes.id || `asst-posts-${Date.now()}`,
        role: 'assistant',
        content: `I've crafted ${selectedPlatforms.length} posts tailored for ${selectedPlatforms.join(', ')} using ${chatRes.model}. Each post is formatted with clean media, description, and hashtags:`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        posts: chatRes.posts,
        selectedPlatforms: selectedPlatforms,
      };

      setMessages(prev => [...prev, postResultMsg]);

      // Update active conversation in history and localStorage
      if (activeConversationId) {
        updateConversationsAndStorage(prev =>
          prev.map(c =>
            c.id === activeConversationId
              ? {
                  ...c,
                  messages: [...c.messages, postResultMsg],
                  hasGeneratedPosts: true,
                }
              : c
          )
        );
      }

      // Decrement credits
     
    } catch (err: unknown) {
      console.error('[SocialStudio] AI generation failed:', err);
      const errorText = err instanceof Error ? err.message : 'AI generation failed';
      showToast(errorText, 'error');

      const errorMsg: ChatMessage = {
        id: `asst-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **AI Generation Error**: ${errorText}\n\n💡 **How to resolve**: Add your free API key in your \`.env\` or \`.env.local\` file:\n- \`GEMINI_API_KEY=...\` (Google AI Studio - Free)\n- \`OPENROUTER_API_KEY=...\` (OpenRouter - Free Models)\n- \`NVIDIA_API_KEY=...\` (NVIDIA NIM - Free)\n- \`GROQ_API_KEY=...\` (Groq - Free)`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, errorMsg]);

      if (activeConversationId) {
        updateConversationsAndStorage(prev =>
          prev.map(c =>
            c.id === activeConversationId
              ? {
                  ...c,
                  messages: [...c.messages, errorMsg],
                }
              : c
          )
        );
      }
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Toggle Save to Library for a post card
  const handleToggleSavePost = (post: PostPreview) => {
    const isCurrentlySaved = savedPosts.some(p => p.id === post.id);

    if (isCurrentlySaved) {
      apiClient.library.deleteSavedPost(post.id).catch(err => {
        console.warn('Failed to delete saved post from API:', err);
      });
      updateSavedPostsAndStorage(prev => prev.filter(p => p.id !== post.id));
    } else {
      const savedDoc = { ...post, isSaved: true };
      apiClient.library.savePost(savedDoc).catch(err => {
        console.warn('Failed to save post to API:', err);
      });
      updateSavedPostsAndStorage(prev => [savedDoc, ...prev]);
    }

    // Also update post in messages state so bookmark icon reflects change
    setMessages(prev =>
      prev.map(m => {
        if (!m.posts) return m;
        return {
          ...m,
          posts: m.posts.map(p => (p.id === post.id ? { ...p, isSaved: !p.isSaved } : p)),
        };
      })
    );
  };

  // Delete saved post from Library
  const handleDeleteSavedPost = (id: string) => {
    apiClient.library.deleteSavedPost(id).catch(err => {
      console.warn('Failed to delete saved post from API:', err);
    });
    updateSavedPostsAndStorage(prev => prev.filter(p => p.id !== id));
  };

  // Use brand image in chat input
  const handleUseImageInChat = (url: string) => {
    setActiveAttachedImage(url);
    handleSendMessage(activePrompt || 'Social campaign with selected brand visual', url);
  };

  // Open AI Image Analysis modal
  const handleOpenAIImageAnalysis = (imageUrl?: string) => {
    setAiAnalysisInitialImage(imageUrl);
    setIsAIAnalysisModalOpen(true);
  };

  // Apply analysis results to post prompt and trigger generation
  const handleApplyAIAnalysisToPost = (description: string, hashtags: string[], imageUrl: string) => {
    const fullPrompt = hashtags.length > 0 ? `${description}\n\n${hashtags.join(' ')}` : description;
    setInputValue(fullPrompt);
    setActiveAttachedImage(imageUrl);
    handleSendMessage(fullPrompt, imageUrl);
  };

  const hasMessages = messages.length > 0;

  return (
    <AppShell
      conversations={conversations}
      activeConversationId={activeConversationId}
      onSelectConversation={handleSelectConversation}
      onDeleteConversation={handleDeleteConversation}
      onClearAllChats={handleClearAllChats}
      onNewPlan={handleNewPlan}
      user={userProfile}
      activeTitle={headerTitle}
      savedPosts={savedPosts}
      onDeleteSavedPost={handleDeleteSavedPost}
      brandDetails={brandDetails}
      onUpdateBrandDetails={handleUpdateBrandDetails}
      brandImages={brandImages}
      onUseImageInChat={handleUseImageInChat}
      onOpenDetail={(post) => setActiveDetailPost(post)}
      onOpenAIImageAnalysis={handleOpenAIImageAnalysis}
    >
      {/* 
        Chat Viewport:
        - When empty: Clean centered state with prompt starters and image attachment chat input.
        - When active: Independently scrollable chat thread and post cards, with pinned transparent bottom input.
      */}
      {!hasMessages ? (
        <div className="flex-1 h-full min-h-0 overflow-y-auto custom-scrollbar flex flex-col justify-center items-center px-4 py-8">
          <div className="w-full max-w-3xl flex flex-col items-center">
            <EmptyChatState
              headline="What would you like to create?"
              description="Describe your campaign topic or attach an image. We'll craft platform-tailored posts ready to publish."
            />

            <div className="w-full mt-2">
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSendMessage}
                isLoading={isLoadingPosts}
                isCentered={true}
                placeholder="Describe your post or campaign idea, or attach an image..."
                brandImages={brandImages}
                onOpenAIImageAnalysis={handleOpenAIImageAnalysis}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
          {/* Main Chat Scrollable Stream (Independently scrollable) */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 space-y-6">
            <ChatMessageList
              messages={messages}
              user={userProfile}
              isLoadingPosts={isLoadingPosts}
              activePlatforms={activePlatforms}
              onConfirmPlatforms={handleConfirmPlatforms}
              onToggleSavePost={handleToggleSavePost}
              onOpenDetail={(post) => setActiveDetailPost(post)}
            />
          </div>

          {/* Fixed Bottom Input Bar - Transparent without background color */}
          <div className="shrink-0 p-3 sm:p-4 bg-transparent border-none">
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSendMessage}
              isLoading={isLoadingPosts}
              isCentered={false}
              placeholder="Ask SanPosts to adjust copy, request extra platforms, or refine tone..."
              brandImages={brandImages}
              onOpenAIImageAnalysis={handleOpenAIImageAnalysis}
            />
          </div>
        </div>
      )}

      {/* Full-coverage Detailed Post Inspector Modal */}
      <PostDetailModal
        post={activeDetailPost}
        isOpen={activeDetailPost !== null}
        onClose={() => setActiveDetailPost(null)}
        onToggleSave={handleToggleSavePost}
        onSchedulePost={(post) => {
          router.push('/schedules');
        }}
      />

      {/* Confirmation Alert Modal for Deleting Conversations */}
      <AlertModal
        isOpen={conversationToDelete !== null}
        onClose={() => setConversationToDelete(null)}
        onConfirm={confirmDeleteConversation}
        title="Delete Conversation"
        message="Are you sure you want to delete this chat conversation? This action cannot be undone."
        confirmText="Delete"
      />

      {/* AI Vision Image Analysis & Post Generator Modal */}
      <AIImageAnalysisModal
        isOpen={isAIAnalysisModalOpen}
        onClose={() => setIsAIAnalysisModalOpen(false)}
        initialImageUrl={aiAnalysisInitialImage}
        brandImages={brandImages}
        brandDetails={brandDetails}
        onApplyToPost={handleApplyAIAnalysisToPost}
      />
    </AppShell>
  );
};

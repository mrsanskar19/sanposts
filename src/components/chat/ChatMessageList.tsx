
'use client';

import React from 'react';
import { ChatMessage, PostPreview, SocialPlatform, UserProfile } from '@/types';
import { User, CheckCircle2, Video } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { PlatformSelector } from './PlatformSelector';
import { PostGrid } from '../posts/PostGrid';

const platformIcons: Record<string, string> = {
  instagram: '📸',
  twitter: '𝕏',
  facebook: '👥',
  linkedin: '💼',
  reddit: '🤖',
  blog: '📝',
  threads: '🧵',
  newsletter: '📬',
  medium: '📖',
};

interface ChatMessageListProps {
  messages: ChatMessage[];
  user: UserProfile;
  isLoadingPosts: boolean;
  activePlatforms: SocialPlatform[];
  onConfirmPlatforms: (platforms: SocialPlatform[]) => void;
  onToggleSavePost?: (post: PostPreview) => void;
  onOpenDetail?: (post: PostPreview) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  user,
  isLoadingPosts,
  activePlatforms,
  onConfirmPlatforms,
  onToggleSavePost,
  onOpenDetail,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-4">
      {messages.map((message) => {
        const isUser = message.role === 'user';

        return (
          <div key={message.id} className="space-y-3">
            <div
              className={`flex items-start gap-3.5 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              } animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {/* Avatar */}
              <div className="shrink-0 mt-0.5">
                {isUser ? (
                  <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-[11px] font-bold overflow-hidden ring-1 ring-border">
                    {user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                ) : (
                  <Logo size="sm" showText={false} />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-md sm:rounded-lg px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-[13px] leading-relaxed border ${
                  isUser
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : 'bg-card text-foreground border-border shadow-sm'
                }`}
              >
                {/* Uploaded media previews in chat message */}
                {message.attachments && message.attachments.length > 0 ? (
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    {message.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="rounded-md overflow-hidden border border-border max-w-[220px] bg-muted relative"
                      >
                        {att.type === 'video' ? (
                          <div className="p-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                            <Video className="w-4 h-4 text-muted-foreground shrink-0" />

                            <span className="truncate max-w-[140px] text-foreground">
                              {att.name || 'Video attachment'}
                            </span>
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={att.url}
                            alt="Attached media"
                            className="w-full h-auto max-h-[160px] object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : message.attachedImage ? (
                  <div className="mb-2 rounded-md overflow-hidden border border-border max-w-[260px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={message.attachedImage}
                      alt="Uploaded media"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ) : null}

                {/* Message Content */}
                <div
                  className={`whitespace-pre-wrap font-normal ${
                    isUser ? 'text-background' : 'text-foreground'
                  }`}
                >
                  {message.content}
                </div>

                {/* Selected Platforms */}
                {message.selectedPlatforms &&
                  message.selectedPlatforms.length > 0 && (
                    <div
                      className={`mt-2 pt-2 border-t flex flex-wrap items-center gap-1.5 ${
                        isUser
                          ? 'border-background/15'
                          : 'border-border'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isUser
                            ? 'text-background/60'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Target Channels:
                      </span>

                      {message.selectedPlatforms.map((p) => (
                        <span
                          key={p}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize border ${
                            isUser
                              ? 'bg-background/10 text-background border-background/15'
                              : 'bg-muted text-foreground border-border'
                          }`}
                        >
                          <span>{platformIcons[p] || '📱'}</span>
                          <span>{p}</span>
                        </span>
                      ))}
                    </div>
                  )}

                {/* Timestamp */}
                <div
                  className={`mt-2 flex items-center gap-1 text-[10px] ${
                    isUser
                      ? 'text-background/50 justify-end'
                      : 'text-muted-foreground'
                  }`}
                >
                  <span>{message.createdAt}</span>

                  {isUser && (
                    <CheckCircle2 className="w-2.5 h-2.5 ml-0.5" />
                  )}
                </div>
              </div>
            </div>

            {/* Platform Selector Form */}
            {message.showPlatformSelector && (
              <div className="pl-10">
                <PlatformSelector
                  onConfirm={onConfirmPlatforms}
                  isLoading={isLoadingPosts}
                />
              </div>
            )}

            {/* Generated Posts */}
            {message.posts && message.posts.length > 0 && (
              <div className="pt-2 pl-0 sm:pl-10">
                <PostGrid
                  posts={message.posts}
                  isLoading={false}
                  activePlatforms={
                    message.selectedPlatforms || activePlatforms
                  }
                  onToggleSave={onToggleSavePost}
                  onOpenDetail={onOpenDetail}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Loading Skeletons */}
      {isLoadingPosts && (
        <div className="pl-0 sm:pl-10 pt-2">
          <PostGrid
            posts={[]}
            isLoading={true}
            activePlatforms={activePlatforms}
          />
        </div>
      )}
    </div>
  );
};
'use client';

import React, { useState } from 'react';
import { Conversation } from '@/types';
import { MessageSquare, Trash2, Search, X } from 'lucide-react';
import Link from 'next/link';

interface ChatHistoryProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onDeleteConversation,
  searchQuery = '',
  onSearchChange,
}) => {
  const [internalQuery, setInternalQuery] = useState('');
  const query = onSearchChange ? searchQuery : internalQuery;
  const setQuery = onSearchChange || setInternalQuery;

  const filteredConversations = query.trim()
    ? conversations.filter(c =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.messages.some(m => m.content.toLowerCase().includes(query.toLowerCase()))
      )
    : conversations;

  const grouped = {
    today: filteredConversations.filter(c => c.dateCategory === 'today'),
    yesterday: filteredConversations.filter(c => c.dateCategory === 'yesterday'),
    previous_7_days: filteredConversations.filter(c => c.dateCategory === 'previous_7_days'),
    earlier: filteredConversations.filter(c => c.dateCategory === 'earlier'),
  };

  const renderGroup = (title: string, items: Conversation[]) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-400">
          {title}
        </h4>
        <div className="space-y-0.5 px-1">
          {items.map(conversation => {
            const isActive = activeId === conversation.id;

            return (
              <Link
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-all cursor-pointer ${isActive
                    ? 'bg-zinc-200/95 dark:bg-zinc-800/90 text-foreground  font-semibold shadow-xs'
                    : 'text-foreground dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-200 font-medium'
                  }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-zinc-950 ' : 'text-zinc-500 dark:text-zinc-500'}`} />
                  <span className="truncate">{conversation.title}</span>
                </div>

                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {onDeleteConversation && (
                    <button
                      type="button"
                      aria-label="Delete conversation"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 flex flex-col">
      {/* Search Input Bar */}
      <div className="relative mb-3 shrink-0">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">
          <Search className="w-3.5 h-3.5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search chats & prompts..."
          className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-zinc-100/90 dark:bg-zinc-900/90 text-xs text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-zinc-200/80 dark:border-zinc-800/80 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute inset-y-0 right-0 pr-2 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-8 px-4 text-xs text-zinc-500 dark:text-zinc-500">
          <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
          <p>No chat history yet.</p>
          <p className="text-[11px] mt-1 text-zinc-400 dark:text-zinc-600">Start a new plan above</p>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center py-6 px-3 text-xs text-zinc-500 dark:text-zinc-400">
          <Search className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
          <p>No chats match &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="flex-1">
          {renderGroup('Today', grouped.today)}
          {renderGroup('Yesterday', grouped.yesterday)}
          {renderGroup('Previous 7 Days', grouped.previous_7_days)}
          {renderGroup('Earlier', grouped.earlier)}
        </div>
      )}
    </div>
  );
};

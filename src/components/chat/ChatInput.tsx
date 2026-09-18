'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, ArrowUp, Upload, Image as ImageIcon, X, Loader2, Video, Sparkles } from 'lucide-react';
import { BrandAsset, MediaAttachment } from '@/types';
import { useToast } from '@/context/ToastContext';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (val: string, attachedImage?: string, attachments?: MediaAttachment[]) => void;
  isLoading?: boolean;
  isCentered?: boolean;
  placeholder?: string;
  brandImages?: BrandAsset[];
  onOpenAIImageAnalysis?: (imageUrl?: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  isCentered = false,
  placeholder = 'What would you like to post about today?...',
  brandImages = [],
  onOpenAIImageAnalysis,
}) => {
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showBrandPicker, setShowBrandPicker] = useState(false);

  // Auto-resize: starts in 1 line (~26px) and grows up to 4 lines (~96px), then scrolls
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollH = textarea.scrollHeight;
    const nextHeight = Math.min(scrollH, 96);
    textarea.style.height = `${Math.max(nextHeight, 26)}px`;
    textarea.style.overflowY = scrollH > 96 ? 'auto' : 'hidden';
  }, [value]);

  // Click outside to close attachment menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAttachmentMenu(false);
        setShowBrandPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || attachments.length > 0) && !isLoading) {
        handleSubmit();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      let loadedCount = 0;

      fileList.forEach(file => {
        const isVid = file.type.startsWith('video/');
        const reader = new FileReader();
        reader.onload = () => {
          const newAtt: MediaAttachment = {
            id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url: reader.result as string,
            type: isVid ? 'video' : 'image',
            name: file.name,
            size: file.size,
          };
          setAttachments(prev => [...prev, newAtt]);
          loadedCount++;
          if (loadedCount === fileList.length) {
            showToast(
              fileList.length === 1
                ? `Attached "${file.name}"`
                : `Attached ${fileList.length} files`,
              'success'
            );
          }
        };
        reader.readAsDataURL(file);
      });
      setShowAttachmentMenu(false);
      setShowBrandPicker(false);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectBrandImage = (url: string) => {
    const newAtt: MediaAttachment = {
      id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url,
      type: 'image',
      name: 'Brand Asset',
    };
    setAttachments(prev => [...prev, newAtt]);
    setShowBrandPicker(false);
    setShowAttachmentMenu(false);
    showToast('Brand visual attached to post!', 'success');
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((value.trim() || attachments.length > 0) && !isLoading) {
      const primaryImage = attachments.find(a => a.type === 'image')?.url;
      onSubmit(value.trim(), primaryImage, attachments);
      setAttachments([]);
      setShowAttachmentMenu(false);
      setShowBrandPicker(false);
    }
  };

  return (
    <div
      className={`w-full transition-all duration-300 relative ${isCentered ? 'max-w-2xl mx-auto' : 'max-w-3xl mx-auto'
        }`}
    >
      {/* Hidden File Input for images and videos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,video/*"
        multiple
        className="hidden"
      />

      {/* Attachment Popover Menu */}
      {(showAttachmentMenu || showBrandPicker) && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-2 mb-2 w-72 rounded-lg sm:rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-2xl shadow-black/30 p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 border border-zinc-200/80 dark:border-zinc-800/80"
        >
          {!showBrandPicker ? (
            <div className="space-y-1">
              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Attach Media
              </div>
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachmentMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md sm:rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
              >
                <Upload className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <div className="font-semibold text-foreground ">Upload Images & Videos</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">PNG, JPG, MP4, WebM (Multiple)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowBrandPicker(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md sm:rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
              >
                <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <div className="font-semibold text-foreground ">Choose from Brand Library</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">Use saved brand visuals</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAttachmentMenu(false);
                  onOpenAIImageAnalysis?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md sm:rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 group"
              >
                <Sparkles className="w-4 h-4 text-purple-500 shrink-0 group-hover:rotate-12 transition-transform" />
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>AI Vision Analyzer</span>
                    <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-indigo-500/15 text-indigo-500">AI</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">Analyze image, get description & tags</div>
                </div>
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-bold text-foreground ">
                  Select Brand Asset
                </span>
                <button
                  type="button"
                  onClick={() => setShowBrandPicker(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1 max-h-48 overflow-y-auto custom-scrollbar">
                {brandImages.map(img => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => handleSelectBrandImage(img.url)}
                    className="relative aspect-video rounded-md overflow-hidden group border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 transition-all"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Media Attachment Strip */}
      {attachments.length > 0 && (
        <div className="flex items-center gap-2 mb-2 px-1 overflow-x-auto custom-scrollbar pb-1">
          {attachments.map(att => (
            <div
              key={att.id}
              className="relative group shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 ring-1 ring-indigo-500 flex items-center justify-center shadow-md"
            >
              {att.type === 'video' ? (
                <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center text-zinc-300">
                  <Video className="w-4 h-4 text-indigo-400" />
                  <span className="text-[8px] font-bold uppercase mt-0.5 text-indigo-400">Video</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={att.url} alt="Attached thumbnail" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                aria-label="Remove media"
                className="absolute inset-0 bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap pl-1">
            {attachments.length} {attachments.length === 1 ? 'media item' : 'media items'} attached
          </span>
          {attachments.some(a => a.type === 'image') && (
            <button
              type="button"
              onClick={() => {
                const img = attachments.find(a => a.type === 'image');
                onOpenAIImageAnalysis?.(img?.url);
              }}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[11px] font-bold transition-colors shrink-0 border border-purple-500/20"
            >
              <Sparkles className="w-3 h-3" />
              <span>Analyze with AI</span>
            </button>
          )}
        </div>
      )}

      {/* ALL IN ONE LINE Single Bar Container */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 py-2 rounded-lg sm:rounded-xl backdrop-blur-2xl shadow-xl shadow-black/10 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/25 transition-all"
      >
        {/* 1. Single Pin Icon Button */}
        <button
          type="button"
          onClick={() => {
            setShowAttachmentMenu(!showAttachmentMenu);
            setShowBrandPicker(false);
          }}
          title="Attach Image or Video"
          className={`p-2 rounded-md text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 ${showAttachmentMenu ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' : ''
            }`}
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* AI Vision Quick Action */}
        <button
          type="button"
          onClick={() => {
            const img = attachments.find(a => a.type === 'image');
            onOpenAIImageAnalysis?.(img?.url);
          }}
          title="Analyze Image with AI Vision for description & hashtags"
          className="p-1.5 rounded-md text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors shrink-0 flex items-center gap-1"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">AI Vision</span>
        </button>

        {/* 2. Textarea: 1-line default, expands up to 4 lines, then scrolls */}
        <div className="flex-1 min-w-0 flex items-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full resize-none bg-transparent text-xs sm:text-sm text-foreground  placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none min-h-[26px] max-h-[96px] leading-[24px] py-0.5 overflow-y-auto custom-scrollbar"
          />
        </div>

        {/* 3. Send Button in the same line */}
        <button
          type="submit"
          disabled={(!value.trim() && attachments.length === 0) || isLoading}
          aria-label="Send"
          className={`flex items-center justify-center w-8 h-8 rounded-md font-medium shrink-0 transition-all ${(value.trim() || attachments.length > 0) && !isLoading
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95'
            : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600 cursor-not-allowed'
            }`}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
          ) : (
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      </form>
    </div>
  );
};

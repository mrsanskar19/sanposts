'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  X,
  Lock,
  Sparkles,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  mockConversations,
  mockScheduledPosts,
} from '@/data/mockData';
import {
  BrandAsset,
  BrandDetails,
  Conversation,
  PostPreview,
  ScheduledPost,
  SocialPlatform,
  UserProfile,
} from '@/types';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';

export default function SchedulesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user: authUser, isLoggedIn, isLoading: authLoading } = useAuth();

  // Redirect to /login if unauthenticated
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
        console.error('Failed to parse conversations', e);
      }
    }
    return mockConversations;
  });
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
        console.warn('[SchedulesPage] Error loading library data:', err);
      }
    }

    loadLibrary();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);
  const userProfile: UserProfile = authUser || {
    name: 'SanPosts User',
    email: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    plan: 'Pro',
    creditsUsed: 0,
    creditsTotal: 100,
    isLoggedIn: false,
  };

  // Schedules state with localStorage
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sanposts_scheduled_posts');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse scheduled posts', e);
      }
    }
    return mockScheduledPosts;
  });
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // September 2026
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [activeScheduledPost, setActiveScheduledPost] = useState<ScheduledPost | null>(null);

  const updateScheduledPostsAndStorage = (updater: ScheduledPost[] | ((prev: ScheduledPost[]) => ScheduledPost[])) => {
    setScheduledPosts(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('sanposts_scheduled_posts', JSON.stringify(next));
        } catch (e) {
          console.error('Failed to persist scheduled posts', e);
        }
      }
      return next;
    });
  };

  // New schedule post form
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPlatform, setFormPlatform] = useState<SocialPlatform>('linkedin');
  const [formDate, setFormDate] = useState('2026-09-12');
  const [formTime, setFormTime] = useState('11:00');
  const [formStatus, setFormStatus] = useState<'scheduled' | 'draft'>('scheduled');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (8 = September)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    setCurrentDate(new Date(2026, 8, 8)); // Demo today
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;

    const newPost: ScheduledPost = {
      id: `sch-${Date.now()}`,
      platform: formPlatform,
      title: formTitle.trim() || `${formPlatform} Campaign Post`,
      content: formContent.trim(),
      scheduledDate: formDate,
      scheduledTime: formTime,
      status: formStatus,
      hashtags: ['#socialpost', '#scheduled'],
    };

    updateScheduledPostsAndStorage(prev => [newPost, ...prev]);
    setIsScheduleModalOpen(false);
    setFormTitle('');
    setFormContent('');
    showToast('Post scheduled successfully!', 'success');
  };

  const handleDeleteScheduled = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    updateScheduledPostsAndStorage(prev => prev.filter(p => p.id !== id));
    showToast('Scheduled post removed', 'info');
  };

  const filteredPosts = scheduledPosts.filter(post => {
    if (selectedPlatform === 'all') return true;
    return post.platform === selectedPlatform;
  });

  const getPostsForDay = (day: number) => {
    const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredPosts.filter(p => p.scheduledDate === dayString);
  };

  const platformIcons: Record<string, string> = {
    instagram: '📸',
    twitter: '𝕏',
    facebook: '👥',
    linkedin: '💼',
    reddit: '🤖',
    blog: '📝',
    threads: '🧵',
  };

  return (
    <AppShell
      conversations={conversations}
      activeConversationId={null}
      onSelectConversation={(id) => router.push(`/chat/${id}`)}
      onDeleteConversation={(id) => {
        setConversations(prev => {
          const next = prev.filter(c => c.id !== id);
          if (typeof window !== 'undefined') {
            localStorage.setItem('sanposts_conversations', JSON.stringify(next));
          }
          return next;
        });
      }}
      onClearAllChats={() => {
        setConversations([]);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sanposts_conversations');
        }
      }}
      onNewPlan={() => router.push('/')}
      user={userProfile}
      activeTitle="Content Publishing Calendar"
      savedPosts={savedPosts}
      onDeleteSavedPost={(id) => {
        apiClient.library.deleteSavedPost(id).catch(err => {
          console.warn('Failed to delete saved post from API:', err);
        });
        setSavedPosts(prev => {
          const next = prev.filter(p => p.id !== id);
          if (typeof window !== 'undefined') {
            localStorage.setItem('sanposts_saved_posts', JSON.stringify(next));
          }
          return next;
        });
      }}
      brandDetails={brandDetails}
      onUpdateBrandDetails={(details) => {
        apiClient.library.updateBrandDetails(details).catch(err => {
          console.warn('Failed to update brand details to API:', err);
        });
        setBrandDetails(details);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sanposts_brand_details', JSON.stringify(details));
        }
      }}
      brandImages={brandImages}
    >
      <div className="flex-1 h-full min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-6 flex flex-col">
        {/* Pro Banner with Lock Indicator */}
        <div className="mb-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-zinc-900/40 border border-indigo-500/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-foreground ">
                  Automated Multi-Network Publishing
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  PRO LOCKED
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Direct social API publishing & webhook dispatch is available on SanPosts Pro. Create local schedules or connect keys to automate.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowProModal(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unlock Pro Publishing</span>
          </button>
        </div>

        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode Switcher: Calendar vs Table */}
            <div className="flex items-center p-1 rounded-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${viewMode === 'calendar'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-foreground dark:hover:text-zinc-100'
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Calendar</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${viewMode === 'table'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-foreground dark:hover:text-zinc-100'
                  }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>

            {viewMode === 'calendar' && (
              <div className="flex items-center gap-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-md text-zinc-500 hover:text-foreground dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 text-xs sm:text-sm font-bold text-foreground  min-w-[130px] text-center">
                  {monthNames[month]} {year}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-md text-zinc-500 hover:text-foreground dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {viewMode === 'calendar' && (
              <button
                type="button"
                onClick={handleGoToday}
                className="px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all shadow-xs"
              >
                Today
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            {/* Platform filter chips */}
            {['all', 'linkedin', 'twitter', 'instagram', 'facebook'].map(plat => (
              <button
                key={plat}
                type="button"
                onClick={() => setSelectedPlatform(plat)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap capitalize transition-all ${selectedPlatform === plat
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                  : 'bg-white/70 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800/60'
                  }`}
              >
                {plat === 'all' ? 'All Channels' : plat}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Post</span>
            </button>
          </div>
        </div>

        {/* Main Content Area: Calendar Grid OR Table View */}
        {viewMode === 'calendar' ? (
          <div className="flex-1 min-h-[500px] flex flex-col rounded-lg sm:rounded-xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-md overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/60 dark:bg-zinc-900/40 text-center py-2 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              {daysOfWeek.map(day => (
                <div key={day} className="truncate px-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days cells */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-zinc-200/40 dark:bg-zinc-800/40">
              {/* Blank offset days */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="bg-white/40 dark:bg-zinc-950/40 p-1.5 min-h-[85px] sm:min-h-[105px] opacity-30"
                />
              ))}

              {/* Current month days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const isToday = day === 8 && month === 8; // Sep 8 Demo
                const dayPosts = getPostsForDay(day);

                return (
                  <div
                    key={`day-${day}`}
                    className={`relative p-1.5 sm:p-2 bg-white/70 dark:bg-zinc-950/70 min-h-[85px] sm:min-h-[105px] flex flex-col transition-colors hover:bg-white/90 dark:hover:bg-zinc-900/80 ${isToday ? 'ring-1 ring-inset ring-indigo-500/50 bg-indigo-50/20 dark:bg-indigo-950/20' : ''
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold inline-flex items-center justify-center w-5 h-5 rounded-md ${isToday
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                      >
                        {day}
                      </span>
                      {dayPosts.length > 0 && (
                        <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline">
                          {dayPosts.length} {dayPosts.length === 1 ? 'post' : 'posts'}
                        </span>
                      )}
                    </div>

                    {/* Scheduled Posts in day */}
                    <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 max-h-[70px] sm:max-h-[90px]">
                      {dayPosts.map(post => (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => setActiveScheduledPost(post)}
                          className="w-full text-left p-1 rounded-md bg-zinc-100/90 dark:bg-zinc-900/90 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-foreground  transition-colors border border-zinc-200/60 dark:border-zinc-800/60 flex items-start gap-1"
                        >
                          <span className="text-xs shrink-0">{platformIcons[post.platform] || '📱'}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold truncate flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                              <span>{post.scheduledTime}</span>
                            </div>
                            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 truncate">
                              {post.title || post.content}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Table View for Desktop / Card List for Mobile */
          <div className="flex-1 min-h-[500px] flex flex-col rounded-lg sm:rounded-xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-md overflow-hidden">
            {filteredPosts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-foreground ">No scheduled posts found</h4>
                <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
                  Schedule your first social post to manage and track cross-platform releases from here.
                </p>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Post</span>
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block flex-1 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 uppercase font-bold text-[10px] tracking-wider z-10">
                      <tr>
                        <th className="py-3 px-4">Channel</th>
                        <th className="py-3 px-4">Post Title & Content</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                      {filteredPosts.map(post => (
                        <tr
                          key={post.id}
                          onClick={() => setActiveScheduledPost(post)}
                          className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{platformIcons[post.platform] || '📱'}</span>
                              <span className="capitalize font-semibold text-zinc-800 dark:text-zinc-200">
                                {post.platform}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-md">
                            <p className="font-bold text-foreground  truncate">
                              {post.title || `${post.platform} update`}
                            </p>
                            <p className="text-zinc-500 dark:text-zinc-400 line-clamp-1 text-[11px]">
                              {post.content}
                            </p>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                              <Clock className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{post.scheduledDate}</span>
                              <span className="text-zinc-400">at {post.scheduledTime}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${post.status === 'scheduled'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                                }`}
                            >
                              {post.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => handleDeleteScheduled(post.id, e)}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title="Delete schedule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
                  {filteredPosts.map(post => (
                    <div
                      key={post.id}
                      onClick={() => setActiveScheduledPost(post)}
                      className="p-3 rounded-lg bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{platformIcons[post.platform] || '📱'}</span>
                          <span className="text-xs font-bold text-foreground  capitalize">
                            {post.platform}
                          </span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${post.status === 'scheduled'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                        >
                          {post.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-2">
                        {post.title || post.content}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-200/40 dark:border-zinc-800/40 text-[11px] text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          <span>{post.scheduledDate} {post.scheduledTime}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteScheduled(post.id, e)}
                          className="p-1 text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PRO UPGRADE MODAL */}
      {showProModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md p-6 rounded-lg sm:rounded-xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-foreground ">
                  Upgrade to SanPosts Pro
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProModal(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Unlock automated multi-channel queuing, webhooks, and programmatic social publishing across all major networks without leaving your studio.
            </p>

            <div className="space-y-2 p-3 rounded-lg bg-zinc-100/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/60 text-xs">
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Auto-dispatch to Twitter, LinkedIn, Instagram & Facebook</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Bring your own custom API keys or use managed dispatchers</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Granular release windows and analytics webhook callbacks</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Unlimited scheduled slots and asset synchronizations</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProModal(false)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Maybe Later
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProModal(false);
                  showToast('Pro tier requested! Contacting licensing server...', 'info');
                }}
                className="px-4 py-2 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors"
              >
                Upgrade to Pro - $19/mo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE NEW POST MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md p-5 rounded-lg sm:rounded-xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800/80"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900 mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-foreground ">
                  Schedule Social Post
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Target Platform
                </label>
                <select
                  value={formPlatform}
                  onChange={e => setFormPlatform(e.target.value as SocialPlatform)}
                  className="w-full px-3 py-2 rounded-md bg-zinc-100 dark:bg-zinc-900 text-xs font-medium text-foreground  focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">X (Twitter)</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="reddit">Reddit</option>
                  <option value="blog">Blog</option>
                  <option value="threads">Threads</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Post Caption / Content
                </label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  placeholder="What would you like to publish? Write or paste copy here..."
                  className="w-full px-3 py-2 rounded-md bg-zinc-100 dark:bg-zinc-900 text-xs text-foreground  focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-xs text-foreground  focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-xs text-foreground  focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'scheduled' | 'draft')}
                    className="w-full px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 text-xs text-foreground  focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST DETAILS DIALOG */}
      {activeScheduledPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-sm p-5 rounded-lg sm:rounded-xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <span className="text-base">{platformIcons[activeScheduledPost.platform]}</span>
                <span className="text-xs font-bold text-foreground  capitalize">
                  {activeScheduledPost.platform} Post
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveScheduledPost(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-zinc-500 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{activeScheduledPost.scheduledDate} at {activeScheduledPost.scheduledTime}</span>
              <span className="ml-auto px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                {activeScheduledPost.status}
              </span>
            </div>

            {activeScheduledPost.imageUrl && (
              <div className="rounded-md overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeScheduledPost.imageUrl}
                  alt="Post asset"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
              {activeScheduledPost.content}
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveScheduledPost(null)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

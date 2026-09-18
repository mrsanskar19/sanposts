'use client';

import React, { useState, useEffect } from 'react';
import { BrandAsset, BrandDetails, PostPreview } from '@/types';
import {
  X,
  Bookmark,
  Building2,
  Image as ImageIcon,
  Copy,
  Check,
  Trash2,
  Send,
  Plus,
  Loader2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { AlertModal } from '../common/AlertModal';
import { useToast } from '@/context/ToastContext';
import { apiClient } from '@/lib/apiClient';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'saved' | 'brand' | 'images';
  onTabChange?: (tab: 'saved' | 'brand' | 'images') => void;
  savedPosts?: PostPreview[];
  onDeleteSavedPost?: (id: string) => void;
  brandDetails?: BrandDetails;
  onUpdateBrandDetails?: (details: BrandDetails) => void;
  brandImages?: BrandAsset[];
  onUseImageInChat?: (imageUrl: string) => void;
  onOpenDetail?: (post: PostPreview) => void;
  onOpenAIImageAnalysis?: (imageUrl: string) => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'saved',
  onTabChange,
  savedPosts: parentSavedPosts,
  onDeleteSavedPost,
  brandDetails: parentBrandDetails,
  onUpdateBrandDetails,
  brandImages: parentBrandImages,
  onUseImageInChat,
  onOpenDetail,
  onOpenAIImageAnalysis,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'saved' | 'brand' | 'images'>(defaultTab);
  const [prevDefaultTab, setPrevDefaultTab] = useState(defaultTab);

  if (prevDefaultTab !== defaultTab) {
    setPrevDefaultTab(defaultTab);
    setActiveTab(defaultTab);
  }

  const handleTabSwitch = (tab: 'saved' | 'brand' | 'images') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Local state initialized from parents or API
  const [savedPosts, setSavedPosts] = useState<PostPreview[]>(parentSavedPosts || []);
  const [brandForm, setBrandForm] = useState<BrandDetails>(
    parentBrandDetails || {
      brandName: '',
      tagline: '',
      toneOfVoice: '',
      targetAudience: '',
      defaultHashtags: [],
    }
  );
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>(parentBrandImages || []);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Deletion confirmation state
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  // New Asset creation form state
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAssetTitle, setNewAssetTitle] = useState('');
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('General');
  const [isSavingAsset, setIsSavingAsset] = useState(false);

  // Fetch real data from API v1 when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingData(true);

    async function fetchLibraryData() {
      try {
        const [savedRes, brandRes, assetsRes] = await Promise.allSettled([
          apiClient.library.getSavedPosts(),
          apiClient.library.getBrandDetails(),
          apiClient.library.getBrandAssets(),
        ]);

        if (!isMounted) return;

        if (savedRes.status === 'fulfilled' && savedRes.value.posts) {
          setSavedPosts(savedRes.value.posts);
        } else if (parentSavedPosts) {
          setSavedPosts(parentSavedPosts);
        }

        if (brandRes.status === 'fulfilled' && brandRes.value) {
          setBrandForm(brandRes.value);
        } else if (parentBrandDetails) {
          setBrandForm(parentBrandDetails);
        }

        if (assetsRes.status === 'fulfilled' && assetsRes.value.assets) {
          setBrandAssets(assetsRes.value.assets);
        } else if (parentBrandImages) {
          setBrandAssets(parentBrandImages);
        }
      } catch (err) {
        console.warn('[LibraryModal] Failed to fetch library data:', err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    fetchLibraryData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, parentSavedPosts, parentBrandDetails, parentBrandImages]);

  if (!isOpen) return null;

  const handleCopyPost = async (post: PostPreview, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const full = `${post.content}\n\n${post.hashtags.join(' ')}`;
      await navigator.clipboard.writeText(full);
      setCopiedPostId(post.id);
      showToast(`${post.platform} post copied to clipboard!`, 'success');
      setTimeout(() => setCopiedPostId(null), 2000);
    } catch {
      showToast('Failed to copy text', 'error');
    }
  };

  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;
    const id = postToDelete;
    setPostToDelete(null);

    // Optimistic UI update
    setSavedPosts(prev => prev.filter(p => p.id !== id));
    onDeleteSavedPost?.(id);

    try {
      await apiClient.library.deleteSavedPost(id);
      showToast('Saved post removed from library', 'success');
    } catch (err) {
      console.warn('API error deleting saved post:', err);
      showToast('Post removed locally', 'info');
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBrand(true);

    try {
      const updated = await apiClient.library.updateBrandDetails(brandForm);
      onUpdateBrandDetails?.(updated);
      setBrandForm(updated);
      showToast('Brand identity guidelines saved successfully!', 'success');
    } catch (err) {
      console.warn('API error updating brand:', err);
      onUpdateBrandDetails?.(brandForm);
      showToast('Brand guidelines saved locally', 'info');
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleUseAsset = (url: string) => {
    onUseImageInChat?.(url);
    showToast('Brand asset loaded into chat prompt!', 'info');
    onClose();
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetUrl.trim()) {
      showToast('Please enter a valid image URL', 'error');
      return;
    }

    setIsSavingAsset(true);
    try {
      const asset = await apiClient.library.addBrandAsset({
        title: newAssetTitle.trim() || 'Media Asset',
        url: newAssetUrl.trim(),
        category: newAssetCategory,
        dimensions: '1920x1080',
      });

      setBrandAssets(prev => [asset, ...prev]);
      setIsAddingAsset(false);
      setNewAssetTitle('');
      setNewAssetUrl('');
      showToast('Brand media asset added to library!', 'success');
    } catch (err) {
      console.error('Failed to create asset:', err);
      showToast('Failed to add asset', 'error');
    } finally {
      setIsSavingAsset(false);
    }
  };

  const handleConfirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    const id = assetToDelete;
    setAssetToDelete(null);

    setBrandAssets(prev => prev.filter(a => a.id !== id));
    try {
      await apiClient.library.deleteBrandAsset(id);
      showToast('Media asset removed from library', 'success');
    } catch (err) {
      console.warn('API error deleting asset:', err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className="relative w-full max-w-5xl h-[80vh] min-h-[580px] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col border border-zinc-200/80 dark:border-zinc-800/80"
          onClick={e => e.stopPropagation()}
        >
          {/* Header with Logo */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" showText={false} />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Content Library
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Manage saved posts, brand identity, and media assets
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Responsive Tab Bar */}
          <div className="flex items-center justify-between px-4 overflow-x-auto custom-scrollbar border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/20">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleTabSwitch('saved')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                  activeTab === 'saved'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved Posts ({savedPosts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('brand')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                  activeTab === 'brand'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Brand Identity</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('images')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                  activeTab === 'images'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Brand Media ({brandAssets.length})</span>
              </button>
            </div>

            {/* Quick Action Button for Images tab */}
            {activeTab === 'images' && (
              <button
                type="button"
                onClick={() => setIsAddingAsset(true)}
                className="my-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Asset</span>
              </button>
            )}
          </div>

          {/* Modal Body */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            {isLoadingData ? (
              <div className="flex flex-col items-center justify-center py-24 text-zinc-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-xs">Loading library...</span>
              </div>
            ) : (
              <>
                {/* TAB 1: SAVED POSTS */}
                {activeTab === 'saved' && (
                  <div className="space-y-4">
                    {savedPosts.length === 0 ? (
                      <div className="text-center py-16 px-4 text-zinc-500 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                          <Bookmark className="w-6 h-6 opacity-80" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">No saved posts yet</p>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Click the bookmark icon on any post card in the studio or schedule list to save it to your library.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {savedPosts.map(post => (
                          <div
                            key={post.id}
                            onClick={() => onOpenDetail?.(post)}
                            className="group flex flex-col rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/60 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-indigo-500/40"
                          >
                            <div className="flex items-center justify-between p-3 bg-zinc-200/50 dark:bg-zinc-800/50">
                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 capitalize flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                {post.platform} Post
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={e => handleCopyPost(post, e)}
                                  className="p-1.5 rounded-lg text-zinc-500 hover:text-foreground dark:hover:text-zinc-100 hover:bg-zinc-300/60 dark:hover:bg-zinc-700 transition-colors"
                                  title="Copy text"
                                >
                                  {copiedPostId === post.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setPostToDelete(post.id);
                                  }}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                  title="Remove from saved"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {post.imageUrl && (
                              <div className="w-full h-32 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={post.imageUrl}
                                  alt="Saved post media"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}

                            <div className="p-3.5 flex-1">
                              <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-4 leading-relaxed whitespace-pre-line">
                                {post.content}
                              </p>
                            </div>

                            {post.hashtags.length > 0 && (
                              <div className="px-3.5 pb-3 flex flex-wrap gap-1">
                                {post.hashtags.slice(0, 4).map((tag, idx) => (
                                  <span key={idx} className="text-[10px] text-zinc-400 font-medium">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: BRAND DETAILS */}
                {activeTab === 'brand' && (
                  <form onSubmit={handleSaveBrand} className="space-y-4 max-w-xl mx-auto py-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Brand / Creator Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Acme Studio"
                        value={brandForm.brandName}
                        onChange={e => setBrandForm({ ...brandForm, brandName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Core Tagline
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Building high-impact tools for founders"
                        value={brandForm.tagline}
                        onChange={e => setBrandForm({ ...brandForm, tagline: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Tone of Voice Guidelines
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Authoritative, direct, crisp, and data-backed"
                        value={brandForm.toneOfVoice}
                        onChange={e => setBrandForm({ ...brandForm, toneOfVoice: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed custom-scrollbar transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Target Audience
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Software engineers, founders, and tech executives"
                        value={brandForm.targetAudience}
                        onChange={e => setBrandForm({ ...brandForm, targetAudience: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Default Hashtags (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="#buildinpublic, #startups, #growth"
                        value={brandForm.defaultHashtags.join(', ')}
                        onChange={e =>
                          setBrandForm({
                            ...brandForm,
                            defaultHashtags: e.target.value
                              .split(',')
                              .map(s => s.trim())
                              .filter(Boolean),
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>

                    <div className="pt-3 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={isSavingBrand}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50"
                      >
                        {isSavingBrand ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving Guidelines...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Brand Guidelines</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 3: BRAND IMAGES & MEDIA */}
                {activeTab === 'images' && (
                  <div className="space-y-5">
                    {/* Add Asset Inline Form */}
                    {isAddingAsset && (
                      <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-foreground">Add Brand Media Asset</h4>
                          <button
                            type="button"
                            onClick={() => setIsAddingAsset(false)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleCreateAsset} className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                                Asset Title
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Modern Workspace"
                                value={newAssetTitle}
                                onChange={e => setNewAssetTitle(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                                Category
                              </label>
                              <select
                                value={newAssetCategory}
                                onChange={e => setNewAssetCategory(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="General">General</option>
                                <option value="Architecture">Architecture</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Analytics">Analytics</option>
                                <option value="Product">Product</option>
                                <option value="People">People</option>
                                <option value="Abstract">Abstract</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                              Image URL (HTTPS)
                            </label>
                            <input
                              type="url"
                              placeholder="https://images.unsplash.com/..."
                              value={newAssetUrl}
                              onChange={e => setNewAssetUrl(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          {newAssetUrl && (
                            <div className="w-full h-28 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={newAssetUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={() => {}}
                              />
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsAddingAsset(false)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingAsset}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              {isSavingAsset ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save Asset</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {brandAssets.length === 0 ? (
                      <div className="text-center py-16 px-4 text-zinc-500 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                          <ImageIcon className="w-6 h-6 opacity-80" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">No brand assets yet</p>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Add your logos, brand photography, or graphics to quickly attach them to post prompts.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddingAsset(true)}
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Your First Asset</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        {brandAssets.map(asset => (
                          <div
                            key={asset.id}
                            className="group relative rounded-2xl overflow-hidden bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 transition-all hover:shadow-md"
                          >
                            <div className="w-full aspect-video overflow-hidden bg-zinc-200 dark:bg-zinc-800 relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={asset.url}
                                alt={asset.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <button
                                type="button"
                                onClick={() => setAssetToDelete(asset.id)}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete asset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="p-3">
                              <h4 className="text-xs font-semibold text-foreground truncate">
                                {asset.title}
                              </h4>
                              <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-500">
                                <span className="px-1.5 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800/60 text-[10px] font-medium">
                                  {asset.category}
                                </span>
                                <span>{asset.dimensions}</span>
                              </div>
                              <div className="flex gap-1.5 mt-2.5">
                                <button
                                  type="button"
                                  onClick={() => handleUseAsset(asset.url)}
                                  className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Use in Post</span>
                                </button>
                                {onOpenAIImageAnalysis && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onOpenAIImageAnalysis(asset.url);
                                    }}
                                    title="Analyze with AI Vision"
                                    className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-500/20 flex items-center justify-center transition-colors shrink-0"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Deletion Confirmation Alert Modals */}
      <AlertModal
        isOpen={postToDelete !== null}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleConfirmDeletePost}
        title="Delete Saved Post"
        message="Are you sure you want to remove this post from your library? This action cannot be undone."
        confirmText="Remove"
      />

      <AlertModal
        isOpen={assetToDelete !== null}
        onClose={() => setAssetToDelete(null)}
        onConfirm={handleConfirmDeleteAsset}
        title="Delete Media Asset"
        message="Are you sure you want to remove this brand asset? This action cannot be undone."
        confirmText="Delete"
      />
    </>
  );
};

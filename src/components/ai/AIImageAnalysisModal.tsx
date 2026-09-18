'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  RefreshCw,
  Hash,
  Eye,
  Lightbulb,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { BrandAsset, BrandDetails } from '@/types';
import { apiClient, ImageAnalysisResult } from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';

interface AIImageAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageUrl?: string;
  brandImages?: BrandAsset[];
  brandDetails?: BrandDetails;
  onApplyToPost: (description: string, hashtags: string[], imageUrl: string) => void;
}

export const AIImageAnalysisModal: React.FC<AIImageAnalysisModalProps> = ({
  isOpen,
  onClose,
  initialImageUrl,
  brandImages = [],
  brandDetails,
  onApplyToPost,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [sourceMode, setSourceMode] = useState<'upload' | 'brand' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [promptHint, setPromptHint] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Synchronize initial image when opened
  useEffect(() => {
    if (isOpen) {
      setAnalysisError(null);
      if (initialImageUrl) {
        setSelectedImageUrl(initialImageUrl);
        setSourceMode('url');
        setUrlInput(initialImageUrl);
      } else if (brandImages.length > 0 && !selectedImageUrl) {
        setSelectedImageUrl(brandImages[0].url);
        setSourceMode('brand');
      }
    }
  }, [isOpen, initialImageUrl, brandImages]);

  // Update editable description when analysis finishes
  useEffect(() => {
    if (analysisResult?.description) {
      setCustomDescription(analysisResult.description);
    }
  }, [analysisResult]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setSelectedImageUrl(result);
        setAnalysisResult(null);
        setAnalysisError(null);
        showToast('Image uploaded for analysis', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectBrandImage = (url: string) => {
    setSelectedImageUrl(url);
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setSelectedImageUrl(urlInput.trim());
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImageUrl) {
      showToast('Please select or upload an image first', 'info');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await apiClient.ai.analyzeImage({
        imageUrl: selectedImageUrl,
        promptHint: promptHint.trim() || undefined,
        brandContext: brandDetails,
      });

      setAnalysisResult(result);
      showToast('AI analysis completed!', 'success');
    } catch (err: unknown) {
      console.error('Image analysis failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to analyze image';
      setAnalysisError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyText = async (text: string, sectionKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionKey);
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      showToast('Failed to copy text', 'error');
    }
  };

  const handlePrependHook = (hook: string) => {
    setCustomDescription(prev => `${hook}\n\n${prev}`);
    showToast('Hook prepended to description', 'info');
  };

  const handleApply = () => {
    if (!selectedImageUrl) return;

    const descToUse = customDescription.trim() || analysisResult?.description || promptHint || 'Generated Social Post';
    const hashtagsToUse = analysisResult?.hashtags || [];

    onApplyToPost(descToUse, hashtagsToUse, selectedImageUrl);
    onClose();
    showToast('Post prompt and image applied to Social Studio!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>AI Vision Analyzer & Post Generator</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  Multimodal
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Extract visual semantics, generate compelling social captions, and discover high-impact hashtags.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
          {/* Top Grid: Image Selection & Preview + Analysis Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Column: Image Selection & Preview (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              {/* Source Selector Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSourceMode('upload')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    sourceMode === 'upload'
                      ? 'bg-white dark:bg-zinc-800 text-foreground shadow-xs'
                      : 'text-zinc-500 hover:text-foreground'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('brand')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    sourceMode === 'brand'
                      ? 'bg-white dark:bg-zinc-800 text-foreground shadow-xs'
                      : 'text-zinc-500 hover:text-foreground'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Library</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('url')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    sourceMode === 'url'
                      ? 'bg-white dark:bg-zinc-800 text-foreground shadow-xs'
                      : 'text-zinc-500 hover:text-foreground'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>URL</span>
                </button>
              </div>

              {/* Source Mode Input Panels */}
              {sourceMode === 'upload' && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-indigo-500" />
                    <span>Choose image file from computer</span>
                  </button>
                </div>
              )}

              {sourceMode === 'brand' && (
                <div className="max-h-36 overflow-y-auto custom-scrollbar p-1 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                  {brandImages.length === 0 ? (
                    <div className="py-4 text-center text-xs text-zinc-400">
                      No brand assets yet. Upload via Library.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {brandImages.map(img => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => handleSelectBrandImage(img.url)}
                          className={`relative aspect-video rounded-lg overflow-hidden border transition-all ${
                            selectedImageUrl === img.url
                              ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                              : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {sourceMode === 'url' && (
                <form onSubmit={handleApplyUrl} className="flex gap-1.5">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-xs font-semibold"
                  >
                    Load
                  </button>
                </form>
              )}

              {/* Live Image Preview Container */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                {selectedImageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedImageUrl}
                      alt="Selected preview"
                      className="w-full h-full object-cover"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-indigo-950/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                        <div className="w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 absolute top-0 animate-pulse" />
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
                        <span className="text-xs font-semibold">AI Vision Scanning...</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center text-zinc-400 text-xs gap-1.5">
                    <ImageIcon className="w-8 h-8 stroke-1 text-zinc-300 dark:text-zinc-600" />
                    <span>No image selected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Prompt Hint & Trigger Button (7 cols) */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Campaign Focus or Context (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Announcing new productivity features, Behind the scenes, Founder story..."
                    value={promptHint}
                    onChange={e => setPromptHint(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Gives the AI vision engine additional direction for tailoring the tone and narrative.
                  </p>
                </div>

                {brandDetails?.brandName && (
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                    <div className="font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Active Brand Guidelines: {brandDetails.brandName}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 flex flex-wrap gap-x-4 gap-y-0.5">
                      {brandDetails.toneOfVoice && <span>Tone: {brandDetails.toneOfVoice}</span>}
                      {brandDetails.targetAudience && <span>Audience: {brandDetails.targetAudience}</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!selectedImageUrl || isAnalyzing}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing Visual Composition...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{analysisResult ? 'Re-Analyze Image' : 'Analyze Image with AI'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* AI Provider Error Feedback Banner */}
          {analysisError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs space-y-2 animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>AI Vision API Notice</span>
              </div>
              <p className="leading-relaxed font-medium">{analysisError}</p>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 bg-white/70 dark:bg-zinc-900/70 p-3 rounded-lg border border-red-500/20">
                <div className="font-semibold mb-1 text-foreground">To enable live AI Vision, add a key to your <code className="text-indigo-600 dark:text-indigo-400 font-mono">.env</code> file:</div>
                <div className="space-y-1 font-mono text-[10px] text-zinc-700 dark:text-zinc-300">
                  <div>• <span className="font-bold">GEMINI_API_KEY</span>=your_key_here (Free via Google AI Studio - https://aistudio.google.com)</div>
                  <div>• <span className="font-bold">OPENROUTER_API_KEY</span>=your_key_here (Free via OpenRouter - https://openrouter.ai)</div>
                  <div>• <span className="font-bold">NVIDIA_API_KEY</span>=your_key_here (Free via NVIDIA NIM - https://build.nvidia.com)</div>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Results Section */}
          {analysisResult && (
            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Visual Breakdown Tags */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Detected Visual Semantics
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Processed by {analysisResult.processedByNode.name} ({analysisResult.processedByNode.region})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                    Theme: {analysisResult.visualSummary.theme}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                    Mood: {analysisResult.visualSummary.detectedMood}
                  </span>
                  {analysisResult.visualSummary.keyElements.map((el, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-indigo-100/60 dark:bg-indigo-900/40 text-[10px] text-indigo-700 dark:text-indigo-300 font-medium"
                    >
                      {el}
                    </span>
                  ))}
                </div>
              </div>

              {/* Scroll-stopping Hooks Suggestions */}
              {analysisResult.suggestedHooks && analysisResult.suggestedHooks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Click to Prepend a High-Converting Hook:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {analysisResult.suggestedHooks.map((hook, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePrependHook(hook)}
                        className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-indigo-500 text-left text-[11px] text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        {hook}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Post Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>Generated Social Post Description</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopyText(customDescription, 'desc')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-indigo-600 transition-colors"
                  >
                    {copiedSection === 'desc' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Description</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={customDescription}
                  onChange={e => setCustomDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-zinc-200 dark:border-zinc-800 custom-scrollbar"
                />
              </div>

              {/* Generated Hashtags */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Recommended Hashtags ({analysisResult.hashtags.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopyText(analysisResult.hashtags.join(' '), 'tags')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-indigo-600 transition-colors"
                  >
                    {copiedSection === 'tags' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy All Hashtags</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  {analysisResult.hashtags.map((tag, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleCopyText(tag, `tag-${i}`)}
                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-foreground transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {analysisResult && (
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    `${customDescription}\n\n${analysisResult.hashtags.join(' ')}`,
                    'all'
                  )
                }
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {copiedSection === 'all' ? 'Copied Full Post' : 'Copy All'}
              </button>
            )}

            <button
              type="button"
              onClick={handleApply}
              disabled={!selectedImageUrl}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <span>Apply to Post Generator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

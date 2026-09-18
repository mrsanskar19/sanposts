export type SocialPlatform =
  | 'instagram'
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'reddit'
  | 'blog'
  | 'threads'
  | 'newsletter'
  | 'medium';

export interface PostPreview {
  id: string;
  platform: SocialPlatform;
  title: string;
  content: string;
  hashtags: string[];
  imageUrl?: string;
  isSaved?: boolean;
}

export interface MediaAttachment {
  id: string;
  url: string;
  type: 'image' | 'video';
  name?: string;
  size?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  attachedImage?: string;
  attachments?: MediaAttachment[];
  showPlatformSelector?: boolean;
  selectedPlatforms?: SocialPlatform[];
  posts?: PostPreview[];
  isGenerating?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  dateCategory: 'today' | 'yesterday' | 'previous_7_days' | 'earlier';
  updatedAt: string;
  messages: ChatMessage[];
  hasGeneratedPosts?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  creditsUsed: number;
  creditsTotal: number;
  isLoggedIn?: boolean;
}

export interface BrandDetails {
  brandName: string;
  tagline: string;
  toneOfVoice: string;
  targetAudience: string;
  defaultHashtags: string[];
}

export interface BrandAsset {
  id: string;
  title: string;
  url: string;
  category: string;
  dimensions: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface PromptStarter {
  id: string;
  icon: string;
  title: string;
  prompt: string;
}

export interface ScheduledPost {
  id: string;
  platform: SocialPlatform;
  title: string;
  content: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: 'scheduled' | 'draft' | 'published';
  imageUrl?: string;
  hashtags: string[];
}

export interface CustomModelConfig {
  id: string;
  name: string;
  modelId: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'deepseek' | 'custom';
  baseUrl?: string;
  contextWindow?: number;
  temperature?: number;
}

export interface ApiKeyConfig {
  openai: string;
  anthropic: string;
  gemini: string;
  groq: string;
  deepseek: string;
  defaultModel: string;
  customModels?: CustomModelConfig[];
}

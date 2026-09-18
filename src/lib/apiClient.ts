/**
 * Unified Type-Safe API Client for SanPosts API v1.
 * Provides namespaced methods for auth, chats, posts, schedules, and load balancer.
 */

import {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
} from './api/response';
import {
  BrandAsset,
  BrandDetails,
  PostPreview,
  ScheduledPost,
  SocialPlatform,
  UserProfile,
} from '@/types';
import {
  BalancingStrategy,
  LoadBalancerMetrics,
  NodeStatus,
  UpstreamNode,
} from './api/load-balancer';

export class ApiException extends Error {
  public status: number;
  public code: string;
  public details?: unknown;
  public requestId?: string;

  constructor(errorResponse: ApiErrorResponse, status = 400) {
    super(errorResponse.error.message || 'API request failed');
    this.name = 'ApiException';
    this.status = status;
    this.code = errorResponse.error.code;
    this.details = errorResponse.error.details;
    this.requestId = errorResponse.meta.requestId;
  }
}

export interface AuthLoginResponse {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserProfile & { id: string };
}

export interface ChatCompletionResponse {
  id: string;
  role: 'assistant';
  content: string;
  posts: PostPreview[];
  model: string;
  processedByNode: {
    id: string;
    name: string;
    region: string;
  };
  createdAt: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  system: {
    memoryUsageMb: number;
    nodeVersion: string;
  };
  database: {
    engine: string;
    nodesConfigured: number;
    activeNodes: number;
    nodeStats: Array<{ status: string; latency: number }>;
  };
  loadBalancer: {
    strategy: BalancingStrategy;
    totalNodes: number;
    healthyNodes: number;
    clusterStatus: string;
  };
}

export interface ImageAnalysisPayload {
  imageUrl: string;
  promptHint?: string;
  brandContext?: Partial<BrandDetails>;
}

export interface ImageAnalysisResult {
  imageUrl: string;
  description: string;
  visualSummary: {
    theme: string;
    detectedMood: string;
    keyElements: string[];
    colorPalette: string[];
    composition: string;
  };
  hashtags: string[];
  suggestedHooks: string[];
  suggestedCallToAction: string;
  platformRecommendations: {
    platform: string;
    tip: string;
  }[];
  analyzedAt: string;
  processedByNode: {
    id: string;
    name: string;
    region: string;
  };
}

export interface ApiClientConfig {
  baseUrl?: string;
  tokenStorageKey?: string;
  onUnauthorized?: () => void;
}

const DEFAULT_STORAGE_KEY = 'sanposts_auth_token';

export class ApiClient {
  private baseUrl: string;
  private tokenStorageKey: string;
  private token: string | null = null;
  private onUnauthorized?: () => void;

  constructor(config?: ApiClientConfig) {
    this.baseUrl = config?.baseUrl || '';
    this.tokenStorageKey = config?.tokenStorageKey || DEFAULT_STORAGE_KEY;
    this.onUnauthorized = config?.onUnauthorized;

    // Hydrate token from localStorage on browser
    if (typeof window !== 'undefined') {
      try {
        this.token = localStorage.getItem(this.tokenStorageKey);
      } catch {
        this.token = null;
      }
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          localStorage.setItem(this.tokenStorageKey, token);
        } else {
          localStorage.removeItem(this.tokenStorageKey);
        }
      } catch {
        // LocalStorage unavailable
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      try {
        this.token = localStorage.getItem(this.tokenStorageKey);
      } catch {
        this.token = null;
      }
    }
    return this.token;
  }

  /**
   * Internal HTTP request dispatcher
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const currentToken = this.getToken();
    if (currentToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    let jsonResponse: ApiResponse<T>;
    try {
      jsonResponse = await response.json();
    } catch {
      throw new Error(`Failed to parse API response from ${endpoint} (Status: ${response.status})`);
    }

    if (!response.ok || !jsonResponse.success) {
      if (response.status === 401) {
        this.setToken(null);
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
      }

      if (!jsonResponse.success) {
        throw new ApiException(jsonResponse as ApiErrorResponse, response.status);
      }

      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return (jsonResponse as ApiSuccessResponse<T>).data;
  }

  // ==========================================
  // 1. Authentication APIs
  // ==========================================
  public readonly auth = {
    login: async (email: string, name?: string, password?: string): Promise<AuthLoginResponse> => {
      const data = await this.request<AuthLoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, name, password }),
      });
      if (data.token) {
        this.setToken(data.token);
      }
      return data;
    },

    signup: async (
      email: string,
      name: string,
      password: string,
      plan?: 'Free' | 'Pro' | 'Enterprise'
    ): Promise<AuthLoginResponse> => {
      const data = await this.request<AuthLoginResponse>('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, name, plan,password }),
      });
      if (data.token) {
        this.setToken(data.token);
      }
      return data;
    },

    me: async (): Promise<UserProfile & { id: string }> => {
      return this.request<UserProfile & { id: string }>('/api/v1/auth/me', {
        method: 'GET',
      });
    },

    forgotPassword: async (email: string): Promise<{ message: string; email: string; resetToken?: string; resetUrl?: string }> => {
      return this.request<{ message: string; email: string; resetToken?: string; resetUrl?: string }>(
        '/api/v1/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        }
      );
    },

    resetPassword: async (token: string, newPassword: string): Promise<{ message: string; email: string }> => {
      return this.request<{ message: string; email: string }>('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
    },

    logout: (): void => {
      this.setToken(null);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('sanposts_auth_user');
        } catch {
          // ignore
        }
      }
    },
  };

  // ==========================================
  // 2. Chat & Inference APIs (Load Balanced)
  // ==========================================
  public readonly chats = {
    sendMessage: async (
      message: string,
      platforms?: SocialPlatform[],
      model?: string,
      imageUrl?: string,
      brandContext?: Partial<BrandDetails>
    ): Promise<ChatCompletionResponse> => {
      return this.request<ChatCompletionResponse>('/api/v1/chat', {
        method: 'POST',
        body: JSON.stringify({ message, platforms, model, imageUrl, brandContext }),
      });
    },
  };

  // ==========================================
  // 3. Posts APIs
  // ==========================================
  public readonly posts = {
    list: async (platform?: SocialPlatform): Promise<{ count: number; posts: PostPreview[] }> => {
      const query = platform ? `?platform=${encodeURIComponent(platform)}` : '';
      return this.request<{ count: number; posts: PostPreview[] }>(`/api/v1/posts${query}`, {
        method: 'GET',
      });
    },

    generate: async (
      prompt: string,
      platforms?: SocialPlatform[],
      imageUrl?: string
    ): Promise<{ prompt: string; totalGenerated: number; posts: PostPreview[] }> => {
      return this.request<{ prompt: string; totalGenerated: number; posts: PostPreview[] }>(
        '/api/v1/posts',
        {
          method: 'POST',
          body: JSON.stringify({ prompt, platforms, imageUrl }),
        }
      );
    },
  };

  // ==========================================
  // 4. Schedules APIs
  // ==========================================
  public readonly schedules = {
    list: async (status?: string): Promise<{ count: number; schedules: ScheduledPost[] }> => {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      return this.request<{ count: number; schedules: ScheduledPost[] }>(
        `/api/v1/schedules${query}`,
        {
          method: 'GET',
        }
      );
    },

    create: async (schedule: Omit<ScheduledPost, 'id' | 'status'> & { status?: string }): Promise<ScheduledPost> => {
      return this.request<ScheduledPost>('/api/v1/schedules', {
        method: 'POST',
        body: JSON.stringify(schedule),
      });
    },
  };

  // ==========================================
  // 5. Content Library APIs (Saved Posts, Brand, Assets)
  // ==========================================
  public readonly library = {
    getSavedPosts: async (): Promise<{ count: number; posts: PostPreview[] }> => {
      return this.request<{ count: number; posts: PostPreview[] }>('/api/v1/library/saved-posts', {
        method: 'GET',
      });
    },

    savePost: async (post: PostPreview): Promise<PostPreview> => {
      return this.request<PostPreview>('/api/v1/library/saved-posts', {
        method: 'POST',
        body: JSON.stringify(post),
      });
    },

    deleteSavedPost: async (id: string): Promise<{ success: boolean; removedId: string }> => {
      return this.request<{ success: boolean; removedId: string }>(
        `/api/v1/library/saved-posts?id=${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
        }
      );
    },

    getBrandDetails: async (): Promise<BrandDetails> => {
      return this.request<BrandDetails>('/api/v1/library/brand', {
        method: 'GET',
      });
    },

    updateBrandDetails: async (details: BrandDetails): Promise<BrandDetails> => {
      return this.request<BrandDetails>('/api/v1/library/brand', {
        method: 'PUT',
        body: JSON.stringify(details),
      });
    },

    getBrandAssets: async (): Promise<{ count: number; assets: BrandAsset[] }> => {
      return this.request<{ count: number; assets: BrandAsset[] }>('/api/v1/library/assets', {
        method: 'GET',
      });
    },

    addBrandAsset: async (asset: Omit<BrandAsset, 'id'>): Promise<BrandAsset> => {
      return this.request<BrandAsset>('/api/v1/library/assets', {
        method: 'POST',
        body: JSON.stringify(asset),
      });
    },

    deleteBrandAsset: async (id: string): Promise<{ success: boolean; removedId: string }> => {
      return this.request<{ success: boolean; removedId: string }>(
        `/api/v1/library/assets?id=${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
        }
      );
    },
  };

  // ==========================================
  // 6. Load Balancer APIs
  // ==========================================
  public readonly loadBalancer = {
    getMetrics: async (): Promise<LoadBalancerMetrics> => {
      return this.request<LoadBalancerMetrics>('/api/v1/load-balancer', {
        method: 'GET',
      });
    },

    setStrategy: async (strategy: BalancingStrategy): Promise<{ message: string; metrics: LoadBalancerMetrics }> => {
      return this.request<{ message: string; metrics: LoadBalancerMetrics }>('/api/v1/load-balancer', {
        method: 'POST',
        body: JSON.stringify({ action: 'set_strategy', strategy }),
      });
    },

    addNode: async (node: Partial<UpstreamNode>): Promise<{ message: string; metrics: LoadBalancerMetrics }> => {
      return this.request<{ message: string; metrics: LoadBalancerMetrics }>('/api/v1/load-balancer', {
        method: 'POST',
        body: JSON.stringify({ action: 'add_node', node }),
      });
    },

    setNodeStatus: async (nodeId: string, status: NodeStatus): Promise<{ message: string; metrics: LoadBalancerMetrics }> => {
      return this.request<{ message: string; metrics: LoadBalancerMetrics }>('/api/v1/load-balancer', {
        method: 'POST',
        body: JSON.stringify({ action: 'set_node_status', nodeId, status }),
      });
    },
  };

  // ==========================================
  // 6. Diagnostics & Service Discovery
  // ==========================================
  public readonly health = {
    check: async (): Promise<HealthCheckResponse> => {
      return this.request<HealthCheckResponse>('/api/v1/health', {
        method: 'GET',
      });
    },
  };

  public readonly discovery = {
    getServiceInfo: async (): Promise<Record<string, unknown>> => {
      return this.request<Record<string, unknown>>('/api/v1', {
        method: 'GET',
      });
    },
  };

  // ==========================================
  // 7. AI Vision & Multimodal Analysis
  // ==========================================
  public readonly ai = {
    analyzeImage: async (payload: ImageAnalysisPayload): Promise<ImageAnalysisResult> => {
      return this.request<ImageAnalysisResult>('/api/v1/ai/analyze-image', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  };
}

// Global Singleton Instance
export const apiClient = new ApiClient();

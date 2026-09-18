import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { mockSavedPosts } from '@/data/mockData';
import { generatePostsWithAI, isAIGenerationError } from '@/lib/api/ai-providers';
import { PostPreview, SocialPlatform } from '@/types';
import { sandb } from '@/lib/api/sandb-client';

// In-memory post store for fallback
const postStore: PostPreview[] = [...mockSavedPosts];

export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as SocialPlatform | null;

  let results: PostPreview[] = [];

  try {
    const db = await sandb.getDb();
    const query: Record<string, unknown> = {};
    if (platform) query.platform = platform;
    const dbPosts = await db.find<PostPreview>('posts', query);
    if (dbPosts && dbPosts.length > 0) {
      results = dbPosts;
    }
  } catch {
    // Fallback to memory store if nodes offline
  }

  if (results.length === 0) {
    results = [...postStore];
    if (platform) {
      results = results.filter(p => p.platform === platform);
    }
  }

  return apiSuccess(
    {
      count: results.length,
      posts: results,
    },
    { requestId }
  );
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;

  try {
    const body = await request.json().catch(() => ({}));
    const { prompt, platforms, imageUrl } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return apiError('INVALID_INPUT', 'A prompt is required to generate posts', {
        status: 422,
        requestId,
      });
    }

    const selectedPlatforms: SocialPlatform[] =
      Array.isArray(platforms) && platforms.length > 0
        ? platforms
        : ['twitter', 'linkedin', 'instagram'];

    const { posts: generated, provider, model } = await generatePostsWithAI({
      prompt: prompt.trim(),
      platforms: selectedPlatforms,
      imageUrl,
    });

    // Persist to store & cluster
    postStore.unshift(...generated);
    try {
      const db = await sandb.getDb();
      await db.insertMany('posts', generated as any);
    } catch {
      // In-memory fallback if cluster nodes offline
    }

    return apiSuccess(
      {
        prompt: prompt.trim(),
        provider,
        model,
        totalGenerated: generated.length,
        posts: generated,
      },
      { status: 201, requestId }
    );
  } catch (err: unknown) {
    console.error('Error generating posts:', err);

    if (isAIGenerationError(err)) {
      return apiError(err.code, err.message, {
        status: err.code === 'NO_API_KEYS' ? 400 : 502,
        requestId,
        details: err.details,
      });
    }

    const errorMsg = err instanceof Error ? err.message : 'Failed to generate posts';
    return apiError('INTERNAL_ERROR', errorMsg, {
      status: 500,
      requestId,
    });
  }
}

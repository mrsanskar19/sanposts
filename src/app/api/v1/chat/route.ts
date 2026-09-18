import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { globalLoadBalancer } from '@/lib/api/load-balancer';
import { generatePostsWithAI, isAIGenerationError } from '@/lib/api/ai-providers';
import { SocialPlatform } from '@/types';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;

  try {
    const body = await request.json().catch(() => ({}));
    const { message, platforms, model, imageUrl, brandContext } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return apiError('INVALID_INPUT', 'Chat message content is required', {
        status: 422,
        requestId,
      });
    }

    const selectedPlatforms: SocialPlatform[] =
      Array.isArray(platforms) && platforms.length > 0
        ? platforms
        : ['twitter', 'linkedin'];

    // Dispatch inference workload through the Load Balancer with circuit-breaker failover
    const { result, node, latencyMs } = await globalLoadBalancer.executeWithFailover(
      async (selectedNode) => {
        const { posts: generatedPosts, provider, model: usedModel } = await generatePostsWithAI({
          prompt: message.trim(),
          platforms: selectedPlatforms,
          imageUrl,
          brandContext,
        });

        return {
          id: `msg_${crypto.randomUUID()}`,
          role: 'assistant' as const,
          content: `Generated live social posts with ${provider.toUpperCase()} (${usedModel}) for ${selectedPlatforms.join(', ')} based on: "${message.trim()}".`,
          posts: generatedPosts,
          model: usedModel || model || 'ai-auto',
          provider,
          processedByNode: {
            id: selectedNode.id,
            name: selectedNode.name,
            region: selectedNode.region,
          },
          createdAt: new Date().toISOString(),
        };
      }
    );

    return apiSuccess(result, {
      requestId,
      node: node.id,
      headers: {
        'X-Upstream-Node': node.id,
        'X-Load-Balancer-Strategy': globalLoadBalancer.getStrategy(),
        'X-Upstream-Latency-Ms': String(latencyMs),
      },
    });
  } catch (err: unknown) {
    console.error('Chat API error:', err);

    if (isAIGenerationError(err)) {
      return apiError(err.code, err.message, {
        status: err.code === 'NO_API_KEYS' ? 400 : 502,
        requestId,
        details: err.details,
      });
    }

    const errorMsg = err instanceof Error ? err.message : 'All upstream AI inference workers failed';
    return apiError('UPSTREAM_SERVICE_UNAVAILABLE', errorMsg, {
      status: 503,
      requestId,
    });
  }
}

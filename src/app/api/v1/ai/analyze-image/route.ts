import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { globalLoadBalancer } from '@/lib/api/load-balancer';
import { analyzeImageWithAI, isAIGenerationError } from '@/lib/api/ai-providers';

export interface ImageAnalysisPayload {
  imageUrl: string;
  promptHint?: string;
  brandContext?: {
    brandName?: string;
    tagline?: string;
    toneOfVoice?: string;
    targetAudience?: string;
    defaultHashtags?: string[];
  };
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

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || undefined;

  try {
    const body = (await request.json().catch(() => ({}))) as ImageAnalysisPayload;
    const { imageUrl, promptHint, brandContext } = body;

    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim().length === 0) {
      return apiError('INVALID_INPUT', 'A valid image URL or image data is required for analysis', {
        status: 422,
        requestId,
      });
    }

    // Process through Load Balancer with worker failover & performance telemetry
    const { result, node, latencyMs } = await globalLoadBalancer.executeWithFailover(
      async (selectedNode) => {
        const analysis = await analyzeImageWithAI({
          imageUrl: imageUrl.trim(),
          promptHint,
          brandContext,
        });

        const responseData: ImageAnalysisResult = {
          imageUrl: imageUrl.trim(),
          description: analysis.description,
          visualSummary: {
            theme: analysis.theme,
            detectedMood: analysis.detectedMood,
            keyElements: analysis.keyElements,
            colorPalette: analysis.colorPalette,
            composition: analysis.composition,
          },
          hashtags: analysis.hashtags,
          suggestedHooks: analysis.suggestedHooks,
          suggestedCallToAction: analysis.suggestedCallToAction,
          platformRecommendations: [
            { platform: 'LinkedIn', tip: 'Pair with a tactical 3-step breakdown discussing strategy and execution.' },
            { platform: 'X / Twitter', tip: 'Use as a high-contrast visual attachment with a 2-line contrarian hook.' },
            { platform: 'Instagram', tip: 'Add a clean headline sticker or carousel swipe indicator for maximum saves.' },
          ],
          analyzedAt: new Date().toISOString(),
          processedByNode: {
            id: selectedNode.id,
            name: `${selectedNode.name} (${analysis.provider.toUpperCase()})`,
            region: selectedNode.region,
          },
        };

        return responseData;
      }
    );

    return apiSuccess(result, {
      requestId,
      node: node.id,
      headers: {
        'X-Upstream-Node': node.id,
        'X-Load-Balancer-Strategy': globalLoadBalancer.getStrategy(),
        'X-Vision-Latency-Ms': String(latencyMs),
      },
    });
  } catch (err: unknown) {
    console.error('Image analysis error:', err);

    if (isAIGenerationError(err)) {
      return apiError(err.code, err.message, {
        status: err.code === 'NO_API_KEYS' ? 400 : 502,
        requestId,
        details: err.details,
      });
    }

    const errorMsg = err instanceof Error ? err.message : 'AI vision analysis workers are temporarily unavailable';
    return apiError('UPSTREAM_SERVICE_UNAVAILABLE', errorMsg, {
      status: 503,
      requestId,
    });
  }
}

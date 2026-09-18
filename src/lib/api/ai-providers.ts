/**
 * Multi-Provider AI Inference Engine for SanPosts.
 * Connects to OpenRouter, Google Gemini, NVIDIA NIM, and Groq with automatic failover.
 * Provides clear diagnostics if API keys are missing or invalid so the frontend can notify the user.
 */

import { PostPreview, SocialPlatform, BrandDetails } from '@/types';

export interface AIProviderConfig {
  name: 'gemini' | 'openrouter' | 'nvidia' | 'groq';
  apiKey: string;
  model: string;
}

export interface AIGenerationError {
  isAiError: true;
  code: 'NO_API_KEYS' | 'ALL_PROVIDERS_FAILED' | 'INVALID_API_KEY' | 'RATE_LIMITED';
  message: string;
  details?: Record<string, string>;
}

export function isAIGenerationError(error: unknown): error is AIGenerationError {
  return typeof error === 'object' && error !== null && (error as AIGenerationError).isAiError === true;
}

/**
 * Detect all configured AI providers from environment variables.
 */
export function getConfiguredProviders(): AIProviderConfig[] {
  const providers: AIProviderConfig[] = [];

  // 1. Google Gemini (Best for free multimodal vision & text generation)
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    providers.push({
      name: 'gemini',
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-flash',
    });
  }

  // 2. OpenRouter (Access to Llama 3.3 Free, Mistral Free, Gemini Free)
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouterKey) {
    providers.push({
      name: 'openrouter',
      apiKey: openrouterKey,
      model: process.env.OPENROUTER_MODEL?.trim() || 'meta-llama/llama-3.3-70b-instruct:free',
    });
  }

  // 3. NVIDIA NIM (Llama 3.3, Mistral, Nemotron via OpenAI-compatible endpoint)
  const nvidiaKey = process.env.NVIDIA_API_KEY?.trim();
  if (nvidiaKey) {
    providers.push({
      name: 'nvidia',
      apiKey: nvidiaKey,
      model: process.env.NVIDIA_MODEL?.trim() || 'meta/llama-3.3-70b-instruct',
    });
  }

  // 4. Groq (High-speed Llama 3 inference)
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    providers.push({
      name: 'groq',
      apiKey: groqKey,
      model: process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile',
    });
  }

  return providers;
}

/**
 * Call Google Gemini API
 */
async function callGemini(
  prompt: string,
  apiKey: string,
  model: string,
  imagePayload?: { inlineData: { mimeType: string; data: string } }
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts: unknown[] = [{ text: prompt }];
  if (imagePayload) {
    parts.unshift(imagePayload);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned an empty response');
  }

  return text;
}

/**
 * Call OpenAI-compatible Chat Completion API (OpenRouter, NVIDIA, Groq)
 */
async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: unknown }>,
  extraHeaders: Record<string, string> = {}
): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Provider returned an empty response');
  }

  return content;
}

/**
 * Extract JSON substring from raw markdown codeblocks or responses.
 */
function cleanAndParseJSON<T>(raw: string): T {
  let cleaned = raw.trim();
  // Remove markdown code fences ```json ... ```
  if (cleaned.includes('```json')) {
    cleaned = cleaned.replace(/^[\s\S]*?```json\s*/i, '').replace(/\s*```[\s\S]*$/, '');
  } else if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/^[\s\S]*?```\s*/i, '').replace(/\s*```[\s\S]*$/, '');
  }

  try {
    return JSON.parse(cleaned.trim()) as T;
  } catch {
    // Try to match the first JSON array or object
    const match = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error(`Failed to parse AI response into valid JSON: ${cleaned.slice(0, 150)}...`);
  }
}

/**
 * Generate Multi-Platform Social Media Posts using configured AI providers.
 */
export async function generatePostsWithAI(params: {
  prompt: string;
  platforms: SocialPlatform[];
  imageUrl?: string;
  brandContext?: Partial<BrandDetails>;
}): Promise<{ posts: PostPreview[]; provider: string; model: string }> {
  const providers = getConfiguredProviders();

  if (providers.length === 0) {
    throw {
      isAiError: true,
      code: 'NO_API_KEYS',
      message:
        'No AI API Key is configured. Please configure at least one API key in your .env file: GEMINI_API_KEY, OPENROUTER_API_KEY, NVIDIA_API_KEY, or GROQ_API_KEY.',
    } as AIGenerationError;
  }

  const { prompt, platforms, imageUrl, brandContext } = params;
  const brandName = brandContext?.brandName || 'our brand';
  const tone = brandContext?.toneOfVoice || 'engaging, authentic, and high-conversion';
  const audience = brandContext?.targetAudience || 'creators and professionals';
  const defaultTags = brandContext?.defaultHashtags?.join(', ') || '';

  const systemInstruction = `You are a world-class social media strategist and viral copywriter for ${brandName}.
Target Audience: ${audience}.
Tone of Voice: ${tone}.
${defaultTags ? `Default Hashtags: ${defaultTags}` : ''}

Generate tailored, platform-specific social media posts for each of the following platforms: ${platforms.join(', ')}.
User request / Topic: "${prompt}".

REQUIREMENTS:
1. Format for each platform according to its native best practices:
   - "linkedin": Professional thought leadership, hook line, tactical spacing, question at the end, 3-5 hashtags.
   - "twitter": Punchy, high-impact hook, under 280 chars, line breaks, 2-3 hashtags.
   - "instagram": Engaging visual caption, emotional resonance, clear call to action, 5-10 hashtags.
   - "facebook": Conversational community tone, discussion prompt, 2-4 hashtags.
   - "threads": Casual, authentic, bite-sized observation, 1-3 hashtags.
   - "reddit": Informative community breakdown or question, no corporate jargon, discussion focused.
   - "blog": Structured overview with engaging takeaways.

2. Return ONLY a valid, strict JSON array with no markdown commentary outside the JSON.
Schema:
[
  {
    "platform": "linkedin",
    "title": "Clear headline or theme for the post",
    "content": "Full post text formatted with proper line breaks",
    "hashtags": ["#Tag1", "#Tag2", "#Tag3"]
  }
]`;

  const errors: Record<string, string> = {};

  // Try providers in priority order
  for (const provider of providers) {
    try {
      let rawResponse = '';

      if (provider.name === 'gemini') {
        rawResponse = await callGemini(
          `${systemInstruction}\n\nRespond with the JSON array now:`,
          provider.apiKey,
          provider.model
        );
      } else if (provider.name === 'openrouter') {
        rawResponse = await callOpenAICompatible(
          'https://openrouter.ai/api/v1/chat/completions',
          provider.apiKey,
          provider.model,
          [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `Generate posts for platforms: ${platforms.join(', ')}. Topic: ${prompt}` },
          ],
          {
            'HTTP-Referer': 'https://sanposts.ai',
            'X-Title': 'SanPosts AI Studio',
          }
        );
      } else if (provider.name === 'nvidia') {
        rawResponse = await callOpenAICompatible(
          'https://integrate.api.nvidia.com/v1/chat/completions',
          provider.apiKey,
          provider.model,
          [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `Generate posts for platforms: ${platforms.join(', ')}. Topic: ${prompt}` },
          ]
        );
      } else if (provider.name === 'groq') {
        rawResponse = await callOpenAICompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          provider.apiKey,
          provider.model,
          [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `Generate posts for platforms: ${platforms.join(', ')}. Topic: ${prompt}` },
          ]
        );
      }

      const parsedPosts = cleanAndParseJSON<Array<{
        platform: SocialPlatform;
        title: string;
        content: string;
        hashtags: string[];
      }>>(rawResponse);

      if (!Array.isArray(parsedPosts) || parsedPosts.length === 0) {
        throw new Error('AI returned an empty or non-array post structure');
      }

      const formattedPosts: PostPreview[] = parsedPosts.map((p, idx) => ({
        id: `post-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        platform: p.platform || platforms[idx] || 'twitter',
        title: p.title || `${p.platform} Campaign Post`,
        content: p.content,
        hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      }));

      return {
        posts: formattedPosts,
        provider: provider.name,
        model: provider.model,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors[provider.name] = errMsg;
      console.warn(`[AI Providers] ${provider.name} failed:`, errMsg);
    }
  }

  // If every configured provider failed
  throw {
    isAiError: true,
    code: 'ALL_PROVIDERS_FAILED',
    message: `All configured AI providers failed. Check your API keys and quotas. Details: ${Object.entries(errors)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ')}`,
    details: errors,
  } as AIGenerationError;
}

/**
 * Multimodal AI Image Analysis using Gemini Vision or OpenRouter.
 */
export async function analyzeImageWithAI(params: {
  imageUrl: string;
  promptHint?: string;
  brandContext?: Partial<BrandDetails>;
}): Promise<{
  theme: string;
  detectedMood: string;
  keyElements: string[];
  colorPalette: string[];
  composition: string;
  description: string;
  hashtags: string[];
  suggestedHooks: string[];
  suggestedCallToAction: string;
  provider: string;
  model: string;
}> {
  const providers = getConfiguredProviders();

  if (providers.length === 0) {
    throw {
      isAiError: true,
      code: 'NO_API_KEYS',
      message:
        'No AI API Key found for image analysis. Please configure GEMINI_API_KEY or OPENROUTER_API_KEY in your .env file.',
    } as AIGenerationError;
  }

  const { imageUrl, promptHint, brandContext } = params;
  const brandName = brandContext?.brandName || 'Brand';
  const tone = brandContext?.toneOfVoice || 'Engaging & Professional';

  const systemInstruction = `You are an expert AI vision analyst and social media copywriter for ${brandName} (${tone} tone).
Analyze the visual asset provided.
${promptHint ? `Campaign context: "${promptHint}".` : ''}

You MUST return ONLY a strict JSON object with this exact schema:
{
  "theme": "Core theme in 3-5 words (e.g. Modern SaaS Innovation)",
  "detectedMood": "Aesthetic mood (e.g. Inspiring & Ambitious)",
  "keyElements": ["3-5 specific visual objects or focal elements detected in image"],
  "colorPalette": ["3-4 dominant colors with hex codes or names, e.g. #6366f1 (Indigo)"],
  "composition": "Short 1-sentence note on framing and lighting",
  "description": "Engaging, high-converting social media caption with a strong hook, body explaining the value, and a discussion prompt",
  "hashtags": ["12-16 high-impact, relevant hashtags including #Trending and niche topic tags"],
  "suggestedHooks": ["3 scroll-stopping first lines that could be used for this image"],
  "suggestedCallToAction": "One compelling closing call to action sentence"
}`;

  const errors: Record<string, string> = {};

  // Check if image is base64 data URL
  let imagePayload: { inlineData: { mimeType: string; data: string } } | undefined;
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      imagePayload = {
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      };
    }
  }

  for (const provider of providers) {
    try {
      let rawResponse = '';

      if (provider.name === 'gemini') {
        rawResponse = await callGemini(
          `${systemInstruction}\n\nImage URL: ${imageUrl.startsWith('http') ? imageUrl : '[Base64 Upload]'}\nRespond with JSON only:`,
          provider.apiKey,
          provider.model,
          imagePayload
        );
      } else if (provider.name === 'openrouter') {
        const userContent: unknown[] = [
          { type: 'text', text: `${systemInstruction}\n\nAnalyze this image:` },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ];

        rawResponse = await callOpenAICompatible(
          'https://openrouter.ai/api/v1/chat/completions',
          provider.apiKey,
          // If OpenRouter model is not a vision model, use openrouter vision fallback
          provider.model.includes('vision') || provider.model.includes('flash') || provider.model.includes('4o')
            ? provider.model
            : 'google/gemini-2.0-flash-exp:free',
          [{ role: 'user', content: userContent }],
          {
            'HTTP-Referer': 'https://sanposts.ai',
            'X-Title': 'SanPosts AI Studio',
          }
        );
      } else {
        // Fallback for providers without direct vision: pass URL context to LLM
        rawResponse = await callOpenAICompatible(
          provider.name === 'nvidia'
            ? 'https://integrate.api.nvidia.com/v1/chat/completions'
            : 'https://api.groq.com/openai/v1/chat/completions',
          provider.apiKey,
          provider.model,
          [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `Analyze this image URL and context: ${imageUrl}. Prompt hint: ${promptHint || 'General Campaign'}` },
          ]
        );
      }

      const parsed = cleanAndParseJSON<{
        theme: string;
        detectedMood: string;
        keyElements: string[];
        colorPalette: string[];
        composition: string;
        description: string;
        hashtags: string[];
        suggestedHooks: string[];
        suggestedCallToAction: string;
      }>(rawResponse);

      return {
        ...parsed,
        provider: provider.name,
        model: provider.model,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors[provider.name] = errMsg;
      console.warn(`[AI Providers Vision] ${provider.name} failed:`, errMsg);
    }
  }

  throw {
    isAiError: true,
    code: 'ALL_PROVIDERS_FAILED',
    message: `Image analysis failed across all configured AI providers. Details: ${Object.entries(errors)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ')}`,
    details: errors,
  } as AIGenerationError;
}

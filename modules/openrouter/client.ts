import type { DetectedError } from "../detector/types";
import {
  detectFramework,
  buildSystemPrompt,
  buildUserAnalysisPrompt,
} from "./prompts";
import type {
  AnalysisResult,
  FixSpecification,
  OpenRouterConfig,
} from "./types";

export class OpenRouterAnalyzer {
  private readonly config: Required<OpenRouterConfig>;

  constructor(config: OpenRouterConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENROUTER_API_KEY || "",
      model:
        config.model ||
        process.env.OPENROUTER_MODEL ||
        "qwen/qwen3.8-27b:free",
      temperature: config.temperature ?? 0.1,
      maxTokens: config.maxTokens ?? 3000,
      siteUrl: config.siteUrl || "https://sanposts.ai",
      siteName: config.siteName || "Self-Healing Autonomous System",
      timeoutMs: config.timeoutMs ?? 45000,
    };
  }

  async analyze(
    error: DetectedError,
    additionalContext?: {
      relevantCodeFiles?: Record<string, string>;
      projectMetadata?: Record<string, unknown>;
    }
  ): Promise<AnalysisResult> {
    const apiKey = this.config.apiKey;

    if (!apiKey) {
      return {
        success: false,
        error: "OPENROUTER_API_KEY is not configured.",
      };
    }

    const framework = detectFramework(error);
    const systemPrompt = buildSystemPrompt(framework);
    const userPrompt = buildUserAnalysisPrompt(error, additionalContext);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": this.config.siteUrl,
          "X-Title": this.config.siteName,
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        return {
          success: false,
          error: `OpenRouter API returned HTTP ${response.status}: ${errorText}`,
          modelUsed: this.config.model,
        };
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const rawContent = data.choices?.[0]?.message?.content?.trim();
      if (!rawContent) {
        return {
          success: false,
          error: "Empty response received from OpenRouter model.",
          modelUsed: this.config.model,
        };
      }

      const fixSpecification = this.parseFixSpecification(
        rawContent,
        error,
        framework
      );

      return {
        success: true,
        fixSpecification,
        rawModelResponse: rawContent,
        modelUsed: this.config.model,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `OpenRouter analysis request failed: ${message}`,
        modelUsed: this.config.model,
      };
    }
  }

  private parseFixSpecification(
    rawJson: string,
    error: DetectedError,
    fallbackFramework: string
  ): FixSpecification {
    let cleanJson = rawJson.trim();

    // Strip markdown code block wrappers if present
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    try {
      const parsed = JSON.parse(cleanJson);
      return {
        id: `fix_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
        incidentId: error.id,
        fingerprint: error.fingerprint,
        detectedFramework: parsed.detectedFramework || fallbackFramework,
        rootCause: parsed.rootCause || "Unknown root cause",
        explanation: parsed.explanation || "No explanation provided",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.85,
        recommendedChanges: Array.isArray(parsed.recommendedChanges)
          ? parsed.recommendedChanges
          : [],
        verificationSteps: Array.isArray(parsed.verificationSteps)
          ? parsed.verificationSteps
          : ["npx tsc --noEmit", "npm test"],
        regressionRisks: Array.isArray(parsed.regressionRisks)
          ? parsed.regressionRisks
          : [],
        generatedAt: new Date().toISOString(),
      };
    } catch {
      // Fallback if JSON was partially malformed
      return {
        id: `fix_${Date.now().toString(36)}_fallback`,
        incidentId: error.id,
        fingerprint: error.fingerprint,
        detectedFramework: fallbackFramework,
        rootCause: "Failed to parse structured JSON from model response.",
        explanation: rawJson.slice(0, 500),
        confidence: 0.5,
        recommendedChanges: [],
        verificationSteps: ["Manual review required"],
        regressionRisks: ["Malformed model output"],
        generatedAt: new Date().toISOString(),
      };
    }
  }
}

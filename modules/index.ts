import {
  type DetectorOptions,
  type DetectorStorage,
  type DetectedError,
  type ErrorInput,
} from "./detector/types";
import { Detector } from "./detector/detector";
import { OpenRouterAnalyzer } from "./openrouter/client";
import type {
  OpenRouterConfig,
  FixSpecification,
  AnalysisResult,
} from "./openrouter/types";
import { JulesAgent } from "./jules/client";
import type {
  JulesConfig,
  JulesExecutionOptions,
  JulesResult,
} from "./jules/types";

export interface SelfHealingOptions {
  detector?: DetectorOptions;
  detectorStorage?: DetectorStorage;
  openrouter?: OpenRouterConfig | boolean;
  jules?: JulesConfig;
  autoHeal?: boolean;
}

export interface HealResult {
  success: boolean;
  incident?: DetectedError;
  analysis?: AnalysisResult;
  fixSpecification?: FixSpecification;
  julesResult?: JulesResult;
  error?: string;
  skipped?: boolean;
}

export class SelfHealingModules {
  public readonly detector: Detector;
  public readonly openrouter: OpenRouterAnalyzer;
  public readonly jules: JulesAgent;
  public readonly openrouterEnabled: boolean;

  // AI Deduplication Registry: guarantees the same file and same error is NEVER sent to AI again
  private readonly sentToAiFingerprints = new Set<string>();
  private readonly sentToAiFileErrors = new Set<string>();

  constructor(options: SelfHealingOptions = {}) {
    this.openrouterEnabled = options.openrouter !== false;
    this.openrouter = new OpenRouterAnalyzer(
      typeof options.openrouter === "object" ? options.openrouter : {}
    );
    this.jules = new JulesAgent(options.jules);

    const autoHealEnabled = options.autoHeal ?? true;

    this.detector = new Detector(
      {
        ...options.detector,
        onCapture: autoHealEnabled
          ? (detected) => {
              void this.heal(detected);
            }
          : options.detector?.onCapture,
      },
      options.detectorStorage
    );
  }

  start(): void {
    this.detector.start();
  }

  stop(): void {
    this.detector.stop();
  }

  /**
   * Extracts the target source file responsible for the error from stack or component stack.
   */
  extractFileFromError(incident: DetectedError): string | null {
    const textToSearch = [
      incident.error.componentStack || "",
      incident.error.stack || "",
    ].join("\n");

    const match = textToSearch.match(
      /(?:at\s+|in\s+)?([A-Za-z0-9_.-]+(?:[\\/][A-Za-z0-9_.-]+)+\.[jt]sx?)/
    );

    if (match && match[1]) {
      return match[1].replace(/\\/g, "/");
    }

    return null;
  }

  /**
   * Orchestrates the complete end-to-end self-healing pipeline:
   * 1. Inspects error fingerprint and file context.
   * 2. STRICT DEDUPLICATION: Ensures the exact same error in the same file is NEVER sent to AI more than once.
   * 3. Performs deep AI root-cause analysis & generates Fix Specification via OpenRouter.
   * 4. Dispatches automated code repair task and branch/PR generation via Google Jules Agent.
   */
  async heal(
    incidentOrId: string | DetectedError | ErrorInput,
    options?: {
      codebaseContext?: Record<string, string>;
      julesOptions?: JulesExecutionOptions;
      openrouter?: boolean;
    }
  ): Promise<HealResult> {
    let incident: DetectedError | undefined;

    if (typeof incidentOrId === "string") {
      incident = await this.detector.getError(incidentOrId);
      if (!incident) {
        return {
          success: false,
          error: `Incident with ID or fingerprint "${incidentOrId}" not found.`,
        };
      }
    } else if ("fingerprint" in incidentOrId) {
      incident = incidentOrId as DetectedError;
    } else {
      incident = await this.detector.capture(incidentOrId as ErrorInput);
      if (!incident) {
        return {
          success: false,
          error: "Failed to capture and normalize input error.",
        };
      }
    }

    // =========================================================================
    // AI DEDUPLICATION GUARD: NEVER SEND SAME FILE & SAME ERROR TO AI AGAIN
    // =========================================================================
    const targetFile = this.extractFileFromError(incident);
    const fileErrorKey = targetFile
      ? `${targetFile}::${incident.error.name}::${incident.error.message}`
      : `${incident.error.name}::${incident.error.message}`;

    if (
      this.sentToAiFingerprints.has(incident.fingerprint) ||
      this.sentToAiFileErrors.has(fileErrorKey)
    ) {
      console.log(
        `[Self-Healing] ⏭️ AI Deduplication: Error "${incident.error.message}" in "${targetFile || "unknown"}" was already sent to AI. Skipping duplicate submission.`
      );
      return {
        success: true,
        incident,
        skipped: true,
        error: `Skipped: Error "${incident.error.message}" was already analyzed and sent to AI.`,
      };
    }

    // Register fingerprint & file key BEFORE calling AI to prevent parallel duplicate calls
    this.sentToAiFingerprints.add(incident.fingerprint);
    this.sentToAiFileErrors.add(fileErrorKey);

    // Determine whether to use OpenRouter or route directly to Google Jules
    const useOpenRouter =
      this.openrouterEnabled && options?.openrouter !== false;

    let analysis: AnalysisResult | undefined;
    let spec: FixSpecification;

    if (useOpenRouter) {
      // Step 1: OpenRouter AI Diagnosis
      console.log(
        `[Self-Healing] 🤖 OpenRouter API Request Sent: Analyzing error for "${incident.error.message}" in "${targetFile || "codebase"}"...`
      );

      analysis = await this.openrouter.analyze(incident, {
        relevantCodeFiles: options?.codebaseContext,
      });

      if (analysis.success && analysis.fixSpecification) {
        spec = analysis.fixSpecification;
        console.log(
          `[Self-Healing] 📝 OpenRouter Response Received: Root Cause: "${spec.rootCause}" | Confidence: ${(spec.confidence * 100).toFixed(0)}% | Changes Proposed: ${spec.recommendedChanges.length} file(s)`
        );
      } else {
        console.warn(
          `[Self-Healing] ⚠️ OpenRouter Analysis Failed: ${analysis.error || "No fix spec generated."}. Routing directly to Google Jules...`
        );
        spec = this.createDirectFixSpecification(incident, targetFile);
      }
    } else {
      console.log(
        `[Self-Healing] ⏭️ OpenRouter is disabled (false). Routing directly to Google Jules...`
      );
      spec = this.createDirectFixSpecification(incident, targetFile);
    }

    // Step 2: Google Jules Coding Agent Execution
    console.log(
      `[Self-Healing] ⚡ Google Jules Action: Initiating automated code repair and PR generation...`
    );

    const julesResult = await this.jules.executeFix(
      spec,
      options?.julesOptions
    );

    if (julesResult.success) {
      console.log(
        `[Self-Healing] ✅ Google Jules Action Response: Status=${julesResult.task?.status || "completed"} | Branch=${julesResult.branch || "N/A"} | Pull Request: ${julesResult.pullRequestUrl || "N/A"}`
      );
    } else {
      console.warn(
        `[Self-Healing] ❌ Google Jules Action Failed: ${julesResult.error || "Execution error"}`
      );
    }

    return {
      success: julesResult.success,
      incident,
      analysis,
      fixSpecification: spec,
      julesResult,
      error: julesResult.error,
    };
  }

  /**
   * Generates a direct FixSpecification from a detected incident
   * to send directly to Google Jules when OpenRouter is disabled or unsuccessful.
   */
  private createDirectFixSpecification(
    incident: DetectedError,
    targetFile: string | null
  ): FixSpecification {
    const errorDetails = [
      `Error Name: ${incident.error.name}`,
      `Error Message: ${incident.error.message}`,
      targetFile ? `Target Source File: ${targetFile}` : undefined,
      incident.error.stack ? `Stack Trace:\n${incident.error.stack}` : undefined,
      incident.error.componentStack
        ? `Component Stack:\n${incident.error.componentStack}`
        : undefined,
      incident.request?.url ? `Request URL: ${incident.request.url}` : undefined,
      incident.browser?.url ? `Browser URL: ${incident.browser.url}` : undefined,
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      id: `fix_direct_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      incidentId: incident.id,
      fingerprint: incident.fingerprint,
      detectedFramework:
        incident.runtimeContext?.framework ||
        (incident.runtime === "frontend" ? "Next.js / React" : "Node.js"),
      rootCause: incident.error.message || `${incident.error.name} error`,
      explanation: `Direct autonomous repair request dispatched to Google Jules (OpenRouter disabled or bypassed):\n\n${errorDetails}`,
      confidence: 1.0,
      recommendedChanges: targetFile
        ? [
            {
              filePath: targetFile,
              action: "modify",
              description: `Investigate and resolve error "${incident.error.message}" in ${targetFile}`,
            },
          ]
        : [],
      verificationSteps: [
        "npm run build",
        "Verify error no longer reproduces",
      ],
      regressionRisks: [
        "Ensure adjacent components and logic remain operational",
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}

// Module Re-exports
export { Detector } from "./detector/detector";
export { OpenRouterAnalyzer } from "./openrouter/client";
export { JulesAgent } from "./jules/client";

export type {
  DetectorError,
  DetectedError,
  DetectorOptions,
  DetectorStorage,
  ErrorInput,
  ErrorSeverity,
  ErrorSource,
  ErrorRuntime,
  RequestContext,
  BrowserContext,
  RuntimeContext,
} from "./detector/types";

export type {
  FixSpecification,
  ProposedFileChange,
  AnalysisResult,
  OpenRouterConfig,
} from "./openrouter/types";

export type {
  JulesTask,
  JulesTaskStatus,
  JulesExecutionOptions,
  JulesResult,
  JulesConfig,
} from "./jules/types";
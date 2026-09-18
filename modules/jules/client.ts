import type { FixSpecification } from "../openrouter/types";
import type {
  JulesConfig,
  JulesExecutionOptions,
  JulesResult,
  JulesTask,
} from "./types";

export class JulesAgent {
  private readonly config: Required<
    Omit<JulesConfig, "apiKey" | "githubToken">
  > & {
    apiKey?: string;
    githubToken?: string;
  };

  constructor(config: JulesConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.JULES_API_KEY || "",
      apiEndpoint:
        config.apiEndpoint ||
        process.env.JULES_API_ENDPOINT ||
        "https://jules.googleapis.com/v1alpha/sessions",
      defaultRepo:
        config.defaultRepo ||
        process.env.GITHUB_REPOSITORY ||
        "mrsanskar19/sanposts",
      defaultBranch: config.defaultBranch || process.env.DEFAULT_BRANCH || "main",
      githubToken: config.githubToken || process.env.GITHUB_TOKEN,
      timeoutMs: config.timeoutMs ?? 30000,
    };
  }

  async executeFix(
    fixSpec: FixSpecification,
    options: JulesExecutionOptions = {}
  ): Promise<JulesResult> {
    const repo = options.repository || this.config.defaultRepo;
    const baseBranch = options.baseBranch || this.config.defaultBranch;
    const branchPrefix = options.branchPrefix || "heal/";
    const branchName = `${branchPrefix}${fixSpec.fingerprint.slice(0, 8)}-${Date.now().toString(36)}`;
    const taskTitle = `[Self-Healing] Fix: ${fixSpec.rootCause.slice(0, 60)}`;

    const promptInstructions = this.formatJulesPrompt(fixSpec, options);

    const task: JulesTask = {
      id: `jules_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      repo,
      branch: branchName,
      baseBranch,
      title: taskTitle,
      prompt: promptInstructions,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // If live Jules API Key is configured, submit to the Google Jules REST API
    if (this.config.apiKey) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

        const res = await fetch(this.config.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
            ...(this.config.githubToken
              ? { "X-GitHub-Token": this.config.githubToken }
              : {}),
          },
          body: JSON.stringify({
            prompt:promptInstructions,
            sourceContext:{
              source:"github",
              githubRepoContext:{
                startingBranch:"main"
              }
            },
            repo:"mrsanskar19/sanposts",
            requirePlanApproval:true,
            automationMode:"AUTO_CREATE_PR",

          }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (res.ok) {
          const body = (await res.json()) as {
            taskId?: string;
            pullRequestUrl?: string;
            branchUrl?: string;
          };

          task.id = body.taskId || task.id;
          task.status = "running";
          task.pullRequestUrl = body.pullRequestUrl;
          task.branchUrl = body.branchUrl;
          task.completedAt = new Date().toISOString();

          return {
            success: true,
            task,
            pullRequestUrl: body.pullRequestUrl,
            branch: branchName,
          };
        } else {
          const errText = await res.text().catch(() => "");
          task.status = "failed";
          task.error = `Jules API error ${res.status}: ${errText}`;
          return {
            success: false,
            task,
            error: task.error,
          };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        task.status = "failed";
        task.error = `Failed to contact Jules API: ${message}`;
        return {
          success: false,
          task,
          error: task.error,
        };
      }
    }

    // Graceful simulation mode for environments without a live Google Jules API subscription
    task.status = "simulated";
    task.summary = `Simulated Jules coding task prepared for repository ${repo} on branch ${branchName}.`;
    task.pullRequestUrl = `https://github.com/${repo}/pull/new/${branchName}`;
    task.completedAt = new Date().toISOString();

    return {
      success: true,
      task,
      pullRequestUrl: task.pullRequestUrl,
      branch: branchName,
      isSimulated: true,
    };
  }

  private formatJulesPrompt(
    fixSpec: FixSpecification,
    options: JulesExecutionOptions
  ): string {
    const lines: string[] = [];

    lines.push(`# Autonomous Self-Healing Task: Fix Incident ${fixSpec.incidentId}`);
    lines.push(`\n**Root Cause:** ${fixSpec.rootCause}`);
    lines.push(`**Explanation:** ${fixSpec.explanation}`);
    lines.push(`**Detected Framework:** ${fixSpec.detectedFramework}`);
    lines.push(`**Confidence Score:** ${(fixSpec.confidence * 100).toFixed(1)}%`);

    if (fixSpec.recommendedChanges.length > 0) {
      lines.push("\n## Recommended Changes:");
      for (const change of fixSpec.recommendedChanges) {
        lines.push(`\n### File: \`${change.filePath}\` (${change.action})`);
        lines.push(`Rationale: ${change.description}`);
        if (change.originalCodeSnippet) {
          lines.push("Target snippet to replace:");
          lines.push("```");
          lines.push(change.originalCodeSnippet);
          lines.push("```");
        }
        if (change.replacementCodeSnippet) {
          lines.push("Replacement code:");
          lines.push("```");
          lines.push(change.replacementCodeSnippet);
          lines.push("```");
        }
        if (change.diff) {
          lines.push("Unified diff:");
          lines.push("```diff");
          lines.push(change.diff);
          lines.push("```");
        }
      }
    }

    lines.push("\n## Verification Instructions:");
    if (options.verificationCommand) {
      lines.push(`- Run verification command: \`${options.verificationCommand}\``);
    }
    for (const step of fixSpec.verificationSteps) {
      lines.push(`- ${step}`);
    }

    if (fixSpec.regressionRisks.length > 0) {
      lines.push("\n## Regression Safeguards:");
      for (const risk of fixSpec.regressionRisks) {
        lines.push(`- ${risk}`);
      }
    }

    lines.push("\n## Goal:");
    lines.push("Apply only the minimal non-breaking code changes, run the verification checks, commit the fix, and open a Pull Request.");

    return lines.join("\n");
  }
}

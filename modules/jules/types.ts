export type JulesTaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "simulated";

export interface JulesTask {
  id: string;
  repo: string;
  branch: string;
  baseBranch: string;
  title: string;
  prompt: string;
  status: JulesTaskStatus;
  pullRequestUrl?: string;
  branchUrl?: string;
  summary?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface JulesExecutionOptions {
  repository?: string;
  baseBranch?: string;
  branchPrefix?: string;
  autoCreatePr?: boolean;
  verificationCommand?: string;
}

export interface JulesResult {
  success: boolean;
  task?: JulesTask;
  pullRequestUrl?: string;
  branch?: string;
  error?: string;
  isSimulated?: boolean;
}

export interface JulesConfig {
  apiKey?: string;
  apiEndpoint?: string;
  defaultRepo?: string;
  defaultBranch?: string;
  githubToken?: string;
  timeoutMs?: number;
}

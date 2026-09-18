export interface ProposedFileChange {
  filePath: string;
  action: "modify" | "create" | "delete";
  description: string;
  originalCodeSnippet?: string;
  replacementCodeSnippet?: string;
  diff?: string;
}

export interface FixSpecification {
  id: string;
  incidentId: string;
  fingerprint: string;
  detectedFramework: string;
  rootCause: string;
  explanation: string;
  confidence: number; // 0.0 - 1.0
  recommendedChanges: ProposedFileChange[];
  verificationSteps: string[];
  regressionRisks: string[];
  generatedAt: string;
}

export interface AnalysisResult {
  success: boolean;
  fixSpecification?: FixSpecification;
  rawModelResponse?: string;
  error?: string;
  modelUsed?: string;
}

export interface OpenRouterConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  siteUrl?: string;
  siteName?: string;
  timeoutMs?: number;
}

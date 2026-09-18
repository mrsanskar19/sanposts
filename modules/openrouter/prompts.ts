import type { DetectedError } from "../detector/types";

export function detectFramework(error: DetectedError): string {
  const textToScan = [
    error.error.name,
    error.error.message,
    error.error.stack || "",
    error.error.componentStack || "",
    error.request?.url || "",
    error.request?.path || "",
  ].join(" ");

  if (textToScan.includes("next/") || textToScan.includes(".next") || textToScan.includes("app-index") || textToScan.includes("Next.js") || textToScan.includes("useRouter") || textToScan.includes("usePathname")) {
    return "Next.js (App/Pages Router)";
  }
  if (textToScan.includes("react") || textToScan.includes("useState") || textToScan.includes("useEffect") || textToScan.includes("useContext") || textToScan.includes("useAuth") || error.error.componentStack) {
    return "React";
  }
  if (textToScan.includes("vue") || textToScan.includes("nuxt") || textToScan.includes("@vue")) {
    return "Vue / Nuxt";
  }
  if (textToScan.includes("svelte") || textToScan.includes("@sveltejs")) {
    return "Svelte / SvelteKit";
  }
  if (textToScan.includes("angular") || textToScan.includes("@angular") || textToScan.includes("ngZone")) {
    return "Angular";
  }
  if (textToScan.includes("express") || textToScan.includes("Router.handle") || textToScan.includes("Layer.handle")) {
    return "Express.js";
  }
  if (textToScan.includes("nestjs") || textToScan.includes("@nestjs")) {
    return "NestJS";
  }
  if (textToScan.includes("fastify")) {
    return "Fastify";
  }
  if (textToScan.includes("django") || textToScan.includes("wsgi") || textToScan.includes("asgi")) {
    return "Django";
  }
  if (textToScan.includes("fastapi") || textToScan.includes("pydantic") || textToScan.includes("starlette")) {
    return "FastAPI";
  }
  if (textToScan.includes("flask") || textToScan.includes("werkzeug")) {
    return "Flask";
  }
  if (textToScan.includes("spring") || textToScan.includes("org.springframework")) {
    return "Spring Boot / Java";
  }

  return error.runtime === "frontend" ? "Universal Frontend (JavaScript/TypeScript)" : "Universal Node.js / Backend";
}

export function buildSystemPrompt(detectedFramework: string): string {
  return `You are an elite Autonomous Software Diagnostic and Self-Healing Repair Engineer.
Your goal is to analyze real-world application errors across any framework or stack (${detectedFramework}) and generate a surgical, production-ready, minimal Fix Specification in strictly formatted JSON.

### PRINCIPLES FOR FIX SPECIFICATIONS:
1. SURGICAL & NON-BREAKING: Make the minimal change required to permanently fix the error. Never rewrite or re-architect unrelated code or formatting.
2. FRAMEWORK AWARENESS:
   - Next.js: Distinguish Server Components vs Client Components ("use client"), proper provider hierarchy in layouts, hydration mismatch safeguards.
   - React: Context provider hierarchy, custom hook boundaries (e.g. ensuring useAuth is executed inside its corresponding AuthProvider), hooks rules, error boundaries.
   - Vue / Nuxt: Provide/inject hierarchy, reactivity traps, Pinia store initialization, SSR lifecycle.
   - Angular: DI token providers, NgModule vs standalone components, async pipe, change detection.
   - Express / Nest / Fastify: Route error handlers, unhandled promise rejections, async middleware error propagation, DB connection drops.
   - Python / Go / Other: Proper exception handling, nil checks, resource closing.
3. OUTPUT FORMAT:
You MUST respond with a single, valid, parseable JSON object matching this schema exactly with NO surrounding markdown backticks or commentary:
{
  "detectedFramework": "${detectedFramework}",
  "rootCause": "Detailed explanation of why this error occurred in the component/call tree",
  "explanation": "High-level summary of the proposed surgical fix",
  "confidence": 0.95,
  "recommendedChanges": [
    {
      "filePath": "path/to/target/file.tsx",
      "action": "modify",
      "description": "Why and what to modify",
      "originalCodeSnippet": "exact target line or block to replace",
      "replacementCodeSnippet": "exact clean replacement code",
      "diff": "unified diff if applicable"
    }
  ],
  "verificationSteps": [
    "Run unit tests: npm test",
    "Run typecheck: npx tsc --noEmit",
    "Test route in browser to verify error resolved"
  ],
  "regressionRisks": [
    "List any subtle edge cases or side-effects to watch for"
  ]
}`;
}

export function buildUserAnalysisPrompt(
  error: DetectedError,
  additionalContext?: {
    relevantCodeFiles?: Record<string, string>;
    projectMetadata?: Record<string, unknown>;
  }
): string {
  const parts: string[] = [];

  parts.push("### DETECTED INCIDENT DETAILS");
  parts.push(`- Incident ID: ${error.id}`);
  parts.push(`- Fingerprint: ${error.fingerprint}`);
  parts.push(`- Runtime: ${error.runtime}`);
  parts.push(`- Source: ${error.source}`);
  parts.push(`- Severity: ${error.severity}`);
  parts.push(`- Occurrences: ${error.occurrences}`);
  parts.push(`- First Seen: ${error.firstSeen}`);
  parts.push(`- Last Seen: ${error.lastSeen}`);

  parts.push("\n### ERROR INFORMATION");
  parts.push(`- Error Name: ${error.error.name}`);
  parts.push(`- Error Message: ${error.error.message}`);
  if (error.error.code) parts.push(`- Error Code: ${error.error.code}`);
  if (error.error.stack) {
    parts.push("\nStack Trace:");
    parts.push("```");
    parts.push(error.error.stack);
    parts.push("```");
  }
  if (error.error.componentStack) {
    parts.push("\nComponent Stack:");
    parts.push("```");
    parts.push(error.error.componentStack);
    parts.push("```");
  }

  if (error.browser) {
    parts.push("\n### BROWSER METADATA");
    if (error.browser.url) parts.push(`- URL: ${error.browser.url}`);
    if (error.browser.platform) parts.push(`- Platform: ${error.browser.platform}`);
    if (error.browser.userAgent) parts.push(`- User Agent: ${error.browser.userAgent}`);
    if (error.browser.viewport) {
      parts.push(`- Viewport: ${error.browser.viewport.width}x${error.browser.viewport.height}`);
    }
  }

  if (error.request) {
    parts.push("\n### REQUEST CONTEXT");
    if (error.request.method) parts.push(`- Method: ${error.request.method}`);
    if (error.request.path || error.request.url) parts.push(`- Path: ${error.request.path || error.request.url}`);
    if (error.request.query) parts.push(`- Query: ${JSON.stringify(error.request.query)}`);
  }

  if (additionalContext?.relevantCodeFiles && Object.keys(additionalContext.relevantCodeFiles).length > 0) {
    parts.push("\n### RELEVANT CODEBASE FILES");
    for (const [filePath, content] of Object.entries(additionalContext.relevantCodeFiles)) {
      parts.push(`\nFile: \`${filePath}\``);
      parts.push("```tsx");
      parts.push(content);
      parts.push("```");
    }
  }

  parts.push("\nPlease diagnose this incident, identify the root cause, and output the exact JSON Fix Specification.");

  return parts.join("\n");
}

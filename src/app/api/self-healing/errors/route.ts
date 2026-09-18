import { NextResponse, type NextRequest } from "next/server";
import { selfHealing } from "../../../../../modules/server";
import type { ErrorInput } from "../../../../../modules/detector/types";

const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce payload size limit to prevent abuse
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: "Payload too large." },
        { status: 413 }
      );
    }

    // 2. Parse JSON body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Invalid body format." },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;

    if (!("error" in payload) || payload.error === null || payload.error === undefined) {
      return NextResponse.json(
        { success: false, error: "Error payload missing." },
        { status: 400 }
      );
    }

    const input: ErrorInput = {
      error: payload.error,
      runtime: payload.runtime === "backend" ? "backend" : "frontend",
      source:
        typeof payload.source === "string"
          ? (payload.source as ErrorInput["source"])
          : "browserError",
      severity:
        typeof payload.severity === "string"
          ? (payload.severity as ErrorInput["severity"])
          : "medium",
      browser:
        payload.browser && typeof payload.browser === "object"
          ? (payload.browser as ErrorInput["browser"])
          : undefined,
      request:
        payload.request && typeof payload.request === "object"
          ? (payload.request as ErrorInput["request"])
          : undefined,
      componentStack:
        typeof payload.componentStack === "string"
          ? payload.componentStack
          : undefined,
    };

    console.log(`[Self-Healing] 📥 Ingesting client-side error: "${typeof input.error === "object" && input.error !== null ? (input.error as Record<string, unknown>).message || "Unknown error" : String(input.error)}"`);

    // Capturing error automatically triggers the background self-healing pipeline (OpenRouter -> Jules)
    const detected = await selfHealing.detector.capture(input);

    return NextResponse.json({
      success: Boolean(detected),
      id: detected?.id,
    });
  } catch {
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}

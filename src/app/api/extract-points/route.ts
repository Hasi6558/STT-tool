import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  Stage2A_CleanupOnlyPrompt,
  Stage2B_SegmentOnlyPrompt,
} from "@/lib/prompts";

// Approximate token / cost helpers -------------------------------------------------
// Heuristic: use both word-count and average chars-per-token (4 chars/token) and
// take the larger value to avoid undercounting short but dense text.
function approxTokenCount(text?: string) {
  if (!text) return 0;
  const trimmed = String(text);
  const wordCount = (trimmed.trim().split(/\s+/).filter(Boolean) || []).length;
  const charBased = Math.max(1, Math.round(trimmed.length / 4));
  return Math.max(wordCount, charBased);
}

// Simple model price-per-1k-token map (USD). These are approximate placeholders.
// Update rates as you get official pricing for each model.
const MODEL_PRICE_PER_1K: Record<string, number> = {
  // gpt-4o: placeholder rate (update to current official price)
  "gpt-4o": 0.03,
  // common examples
  "gpt-4": 0.06,
  "gpt-3.5-turbo": 0.002,
};

function estimateCostUsd(model: string, totalTokens: number) {
  const rate = MODEL_PRICE_PER_1K[model] ?? 0.01; // fallback rough rate
  return (totalTokens / 1000) * rate;
}
// End helpers --------------------------------------------------------------------

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body ?? {};

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not set" },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    const client = new OpenAI({ apiKey });

    // ============================================================
    // STAGE 2A: Cleanup ONLY (verbatim preservation, plain text)
    // ============================================================
    console.info("[Stage 2A] Starting cleanup-only pass...");
    const stage2A_completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: Stage2A_CleanupOnlyPrompt },
        { role: "user", content: text },
      ],
      max_tokens: 15000,
    });

    const cleanedText = stage2A_completion.choices?.[0]?.message?.content ?? "";
    console.log("[Stage 2A] Cleaned text length:", cleanedText.length);
    console.log(
      "[Stage 2A] Cleaned text preview:",
      cleanedText.substring(0, 200) + "...",
    );

    // Log token/cost estimate for Stage 2A
    try {
      const promptTokens = approxTokenCount(Stage2A_CleanupOnlyPrompt);
      const inputTokens = approxTokenCount(text ?? "");
      const outputTokens = approxTokenCount(cleanedText);
      const totalTokens = promptTokens + inputTokens + outputTokens;
      const approxUsd = estimateCostUsd("gpt-4o", totalTokens);
      console.info(
        `[Stage 2A token-estimate] model=gpt-4o tokens=${totalTokens} (prompt=${promptTokens} input=${inputTokens} output=${outputTokens}) approx_cost_usd=${approxUsd.toFixed(6)}`,
      );
    } catch (e) {
      console.warn("[Stage 2A] Failed to compute token/cost estimate:", e);
    }

    if (!cleanedText || cleanedText.trim().length === 0) {
      console.error("[Stage 2A] No cleaned text returned from model.");
      return NextResponse.json(
        { error: "Stage 2A returned empty response" },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    // ============================================================
    // STAGE 2B: Segmentation + headings ONLY (must copy verbatim)
    // ============================================================
    console.info("[Stage 2B] Starting segmentation-only pass...");
    const stage2B_userContent = `TRANSCRIPT:\n"""\n${cleanedText}\n"""`;
    console.log("[Stage 2B] Input length:", stage2B_userContent.length);
    console.log(
      "[Stage 2B] Input preview:",
      stage2B_userContent.substring(0, 200) + "...",
    );
    const stage2B_completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: Stage2B_SegmentOnlyPrompt },
        { role: "user", content: stage2B_userContent },
      ],
      max_tokens: 15000,
    });

    const segmentedText =
      stage2B_completion.choices?.[0]?.message?.content ?? "";
    console.log("[Stage 2B] Segmented text length:", segmentedText.length);
    console.log(
      "[Stage 2B] Segmented text preview:",
      segmentedText.substring(0, 200) + "...",
    );

    // Log token/cost estimate for Stage 2B
    try {
      const promptTokens = approxTokenCount(Stage2B_SegmentOnlyPrompt);
      const inputTokens = approxTokenCount(stage2B_userContent);
      const outputTokens = approxTokenCount(segmentedText);
      const totalTokens = promptTokens + inputTokens + outputTokens;
      const approxUsd = estimateCostUsd("gpt-4o", totalTokens);
      console.info(
        `[Stage 2B token-estimate] model=gpt-4o tokens=${totalTokens} (prompt=${promptTokens} input=${inputTokens} output=${outputTokens}) approx_cost_usd=${approxUsd.toFixed(6)}`,
      );
    } catch (e) {
      console.warn("[Stage 2B] Failed to compute token/cost estimate:", e);
    }

    // Robust JSON parsing
    const finalResult = segmentedText;
    try {
      // Try parsing as JSON to validate format
      const parsed = JSON.parse(segmentedText);
      if (!Array.isArray(parsed)) {
        throw new Error("Stage 2B did not return a JSON array");
      }
      // Validation: ensure each item has heading and text
      for (const item of parsed) {
        if (!item.heading || !item.text) {
          throw new Error("Stage 2B JSON items missing required fields");
        }
      }
      console.info(`[Stage 2B] Successfully parsed ${parsed.length} sections`);
    } catch (parseErr) {
      console.error("[Stage 2B] Failed to parse JSON response:", parseErr);
      console.error("[Stage 2B] Raw response:", segmentedText);
      // Return raw content for debugging (same pattern as existing code)
      return NextResponse.json(
        {
          error: "Stage 2B returned invalid JSON",
          details: String(parseErr),
          raw: segmentedText,
        },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      { result: finalResult },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    // Log the error on the server for debugging
    console.error("/api/extract-points error:", err);

    const safeMessage =
      process.env.NODE_ENV === "production" ?
        "Internal server error"
      : String((err as Error)?.message ?? err);

    return NextResponse.json(
      { error: safeMessage },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

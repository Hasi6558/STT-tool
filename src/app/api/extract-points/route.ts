import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ExtractPointsPrompt } from "@/lib/prompts";

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

    const prompt = ExtractPointsPrompt;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not set" },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text },
      ],
      max_tokens: 8000,
    });

    // Calculate approximate tokens for prompt + input + output and log an estimated cost
    try {
      const outputText = completion.choices?.[0]?.message?.content ?? "";
      const promptTokens = approxTokenCount(prompt);
      const inputTokens = approxTokenCount(text ?? "");
      const outputTokens = approxTokenCount(outputText);
      const totalTokens = promptTokens + inputTokens + outputTokens;
      const approxUsd = estimateCostUsd("gpt-4o", totalTokens);
      console.info(
        `[token-estimate] model=gpt-4o tokens=${totalTokens} (prompt=${promptTokens} input=${inputTokens} output=${outputTokens}) approx_cost_usd=${approxUsd.toFixed(6)}`,
      );
    } catch (e) {
      console.warn("Failed to compute token/cost estimate:", e);
    }

    return NextResponse.json(
      { result: completion.choices[0].message.content },
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

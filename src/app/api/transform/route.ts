import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  ExtractPointsPrompt,
  FinalBasePrompt,
  EnhanceStylePrompt,
  BookStylePrompt,
} from "@/lib/prompts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: CORS_HEADERS });
}

// Types for the two-stage pipeline
interface TransformRequestBody {
  text?: string;
  type?: "enhance" | "book";
  coreArgument?: string;
  extractedPointsJson?: string; // Optional: JSON string from Stage 2 to skip re-extraction
}

interface ExtractedPoint {
  heading: string;
  text: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: TransformRequestBody = await req.json();
    const { text, type, coreArgument, extractedPointsJson } = body ?? {};

    if (!type) {
      return NextResponse.json(
        { error: "Missing type" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Validate type - only "enhance" and "book" are allowed
    if (type !== "enhance" && type !== "book") {
      return NextResponse.json(
        { error: "Invalid type. Only 'enhance' or 'book' are supported." },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not set" },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    const client = new OpenAI({ apiKey });

    // ========================================
    // STAGE 2: Extract points from raw transcript (if not already provided)
    // ========================================
    let extractedPoints: ExtractedPoint[];

    if (extractedPointsJson) {
      // Stage 2 already completed - use the provided JSON
      console.info("[transform] Using pre-extracted points from Stage 2");
      try {
        extractedPoints = JSON.parse(extractedPointsJson) as ExtractedPoint[];
        if (!Array.isArray(extractedPoints)) {
          throw new Error("Provided extractedPointsJson is not an array");
        }
        console.info(
          `[transform] Loaded ${extractedPoints.length} pre-extracted points`,
        );
      } catch (parseError) {
        console.error(
          "[transform] Failed to parse provided extractedPointsJson:",
          parseError,
        );
        return NextResponse.json(
          { error: "Invalid extractedPointsJson format" },
          { status: 400, headers: CORS_HEADERS },
        );
      }
    } else {
      // No pre-extracted points - run Stage 2 now
      if (!text) {
        return NextResponse.json(
          {
            error:
              "Missing text (raw transcript required when extractedPointsJson not provided)",
          },
          { status: 400, headers: CORS_HEADERS },
        );
      }

      console.info("[transform] Starting Stage 2: ExtractPointsPrompt");

      const stage2Completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: ExtractPointsPrompt },
          { role: "user", content: text },
        ],
        max_tokens: 8000,
      });

      const stage2Output = stage2Completion.choices[0]?.message?.content ?? "";

      // Parse the JSON output from Stage 2
      try {
        // Strip markdown code blocks if present
        let jsonText = stage2Output.trim();
        if (jsonText.startsWith("```")) {
          jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
        }
        extractedPoints = JSON.parse(jsonText) as ExtractedPoint[];
        if (!Array.isArray(extractedPoints)) {
          throw new Error("Stage 2 output is not an array");
        }
      } catch (parseError) {
        console.error(
          "[transform] Failed to parse Stage 2 JSON output:",
          parseError,
        );
        console.error("[transform] Raw Stage 2 output:", stage2Output);
        return NextResponse.json(
          { error: "Failed to parse extracted points from Stage 2" },
          { status: 500, headers: CORS_HEADERS },
        );
      }

      console.info(
        `[transform] Stage 2 complete: extracted ${extractedPoints.length} points`,
      );
    }

    // ========================================
    // STAGE 3: Apply final style transformation
    // ========================================
    console.info(
      `[transform] Starting Stage 3: FinalBasePrompt + ${type} style`,
    );

    // Build the Stage 3 prompt
    const currentCoreArgument = coreArgument || "N/A";
    const basePromptWithArg = FinalBasePrompt.replace(
      "{{CORE_ARGUMENT}}",
      currentCoreArgument,
    );

    // Select the style prompt
    const stylePrompt =
      type === "enhance" ? EnhanceStylePrompt : BookStylePrompt;
    const stage3SystemPrompt = basePromptWithArg + "\n\n" + stylePrompt;

    // Format the extracted points as input for Stage 3
    const stage3UserInput = JSON.stringify(extractedPoints, null, 2);

    const stage3Completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: stage3SystemPrompt },
        { role: "user", content: stage3UserInput },
      ],
      max_tokens: 15000,
    });

    const finalResult = stage3Completion.choices[0]?.message?.content ?? "";

    console.info("[transform] Stage 3 complete: final transformation done");

    return NextResponse.json(
      { result: finalResult },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    // Log the error on the server for debugging
    console.error("/api/transform error:", err);

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

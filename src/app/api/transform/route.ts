import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
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

// Types for Stage 3 transformation
interface TransformRequestBody {
  type?: "enhance" | "book";
  coreArgument?: string;
  extractedPointsJson?: string; // Required - output from Stage 2 (extract-points)
}

interface ExtractedPoint {
  heading: string;
  text: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: TransformRequestBody = await req.json();
    const { type, coreArgument, extractedPointsJson } = body ?? {};

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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log("API key : ", apiKey);
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not set" },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    // extractedPointsJson is REQUIRED - Stage 2 must be completed first
    if (!extractedPointsJson) {
      return NextResponse.json(
        {
          error:
            "extractedPointsJson is required. Stage 2 must be completed before Stage 3.",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Parse the pre-extracted points from Stage 2
    let extractedPoints: ExtractedPoint[];
    try {
      extractedPoints = JSON.parse(extractedPointsJson) as ExtractedPoint[];
      if (!Array.isArray(extractedPoints)) {
        throw new Error("Provided extractedPointsJson is not an array");
      }
      console.info(
        `[transform] Loaded ${extractedPoints.length} pre-extracted points from Stage 2`,
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

    const client = new Anthropic({ apiKey });

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

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 15000,
      system: stage3SystemPrompt,
      messages: [
        {
          role: "user",
          content: stage3UserInput,
        },
      ],
    });

    const finalResult =
      message.content
        .filter((b) => b.type === "text")
        .map((b: any) => b.text)
        .join("") ?? "";

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

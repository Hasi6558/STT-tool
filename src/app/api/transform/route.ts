import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CleanUpPrompt, EnhancePrompt, BookPrompt } from "@/lib/prompts";

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
    const { text, type } = body ?? {};

    if (!text || !type) {
      return NextResponse.json(
        { error: "Missing text or type" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const userInputText = text ? text : "";
    let prompt = "";
    switch (type) {
      case "clean":
        prompt += CleanUpPrompt;
        break;
      case "enhance":
        prompt += EnhancePrompt;
        break;
      case "book":
        prompt += BookPrompt;
        break;
      default: {
        return NextResponse.json(
          { error: "Invalid type" },
          { status: 400, headers: CORS_HEADERS }
        );
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not set" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userInputText },
      ],
    });

    return NextResponse.json(
      { result: completion.choices[0].message.content },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    // Log the error on the server for debugging
    console.error("/api/transform error:", err);

    const safeMessage =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : String((err as Error)?.message ?? err);

    return NextResponse.json(
      { error: safeMessage },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

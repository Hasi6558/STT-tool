import { NextRequest, NextResponse } from "next/server";
import Handlebars from "handlebars";
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
interface TransformRequestBody {
  text?: string;
  type?: string;
  coreArgument?: string;
}
export async function POST(req: NextRequest) {
  try {
    const body: TransformRequestBody = await req.json();
    const { text, type, coreArgument } = body ?? {};

    if (!text || !type) {
      return NextResponse.json(
        { error: "Missing text or type" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const userInputText = text ? text : "";
    let currentCoreArgument = "N/A";
    if (coreArgument) {
      currentCoreArgument = coreArgument;
    }
    let prompt = "";
    switch (type) {
      case "clean":
        const cleanTemplate = Handlebars.compile(CleanUpPrompt);
        prompt += cleanTemplate({ currentCoreArgument });
        break;
      case "enhance":
        const enhanceTemplate = Handlebars.compile(EnhancePrompt);
        prompt += enhanceTemplate({ currentCoreArgument });
        break;
      case "book":
        const bookTemplate = Handlebars.compile(BookPrompt);
        prompt += bookTemplate({ currentCoreArgument });
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

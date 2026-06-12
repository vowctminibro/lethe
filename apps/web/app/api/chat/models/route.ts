import { NextResponse } from "next/server";
import { availableModels } from "@/src/lib/llm";

export const runtime = "nodejs";

/**
 * GET -> { models: { key, id, label }[] }
 *
 * The models the chat selector can offer RIGHT NOW — built from configured
 * providers only, so the dropdown never lists a model that would fail its
 * first token. Fill GROQ_API_KEY / GEMINI_API_KEY and they appear here
 * without a code change.
 */
export async function GET() {
  return NextResponse.json({ models: availableModels() });
}

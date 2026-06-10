import { NextRequest, NextResponse } from "next/server";
import { complete } from "@/src/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST { user: string, reply?: string, context?: string[] }
 *   -> { facts: { text, kind }[], provider }   // 0–2 facts
 *
 * The extraction step that runs after each user message: a strict-JSON prompt
 * pulls at most two NEW durable facts from the user's last message, deduped
 * against what's already remembered (`context`). The client persists each fact
 * through the gasless remember() loop and animates it into the memory rail.
 */

const KINDS = ["trading-style", "market-view", "holding", "preference", "fact"] as const;

const SYSTEM = [
  "You extract durable memories for a crypto-native AI agent.",
  "From the user's LAST message only, pull 0–2 NEW stable facts about them:",
  "their trading style, holdings, market views, or preferences.",
  "",
  "Rules:",
  "- Questions, small talk, hypotheticals, or requests are NOT facts → return [].",
  "- Skip anything already covered by the existing memories provided.",
  "- Rewrite each fact as a clean standalone statement under 100 characters,",
  '  e.g. "Trades momentum, avoids leverage" or "Bullish on SUI".',
  `- "kind" must be one of: ${KINDS.join(", ")}.`,
  "",
  'Respond ONLY with JSON: { "facts": [ { "text": string, "kind": string } ] }',
].join("\n");

export async function POST(req: NextRequest) {
  try {
    const { user, reply, context } = await req.json();
    if (typeof user !== "string" || !user.trim()) {
      return NextResponse.json({ error: "missing user message" }, { status: 400 });
    }
    const ctx: string[] = Array.isArray(context) ? context.filter((c) => typeof c === "string") : [];

    const prompt = [
      ctx.length > 0 ? `Existing memories (do not re-extract):\n${ctx.map((c) => `- ${c}`).join("\n")}\n` : "",
      `User's last message: ${user.trim()}`,
      typeof reply === "string" && reply.trim() ? `Agent's reply (context only): ${reply.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { text, provider } = await complete(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      { json: true, temperature: 0.2, maxTokens: 300 },
    );

    let facts: { text: string; kind: string }[] = [];
    try {
      const parsed = JSON.parse(text) as { facts?: unknown };
      if (Array.isArray(parsed.facts)) {
        facts = parsed.facts
          .map((f) => f as Record<string, unknown>)
          .filter((f) => typeof f.text === "string" && (f.text as string).trim())
          .map((f) => ({
            text: (f.text as string).trim().slice(0, 120),
            kind:
              typeof f.kind === "string" && (KINDS as readonly string[]).includes(f.kind as string)
                ? (f.kind as string)
                : "fact",
          }))
          .slice(0, 2);
      }
    } catch {
      /* model broke JSON — extract nothing rather than garbage */
    }

    return NextResponse.json({ facts, provider });
  } catch (e) {
    const message = e instanceof Error ? e.message : "extract failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

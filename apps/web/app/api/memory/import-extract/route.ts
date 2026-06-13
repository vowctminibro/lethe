import { NextRequest, NextResponse } from "next/server";
import { complete } from "@/src/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST { text } -> { facts: { text }[] }
 *
 * Import plane: the user pastes what ANOTHER AI remembers about them
 * ("Ask ChatGPT: what do you remember about me?") and this route splits it
 * into durable standalone facts. The client then runs each fact through the
 * normal remember() loop with kind="imported" — Seal-encrypted, on Walrus,
 * referenced on the vault like any other memory. Extraction only; nothing is
 * stored server-side.
 */

const MAX_INPUT = 8_000; // chars — a full "what do you remember" answer fits
const MAX_FACTS = 20;

const SYSTEM = [
  "You convert another AI's memory dump about a user into clean standalone facts.",
  "The user pasted what ChatGPT (or similar) remembers about them. Extract every",
  "DURABLE fact about the user — preferences, style, holdings, background, views.",
  "",
  "Rules:",
  "- One fact per entry, rewritten standalone in third person-free form,",
  '  under 120 characters. e.g. "Prefers momentum trades, avoids leverage".',
  "- Keep ALL distinct facts (up to 20) — do not merge unrelated ones.",
  "- Skip meta-text, apologies, headers, and anything about the AI itself.",
  '- Respond ONLY with JSON: { "facts": [ { "text": string } ] }',
].join("\n");

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "missing text" }, { status: 400 });
    }
    const input = text.trim().slice(0, MAX_INPUT);

    const { text: out, provider } = await complete(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Pasted memory dump:\n${input}` },
      ],
      // import-extract is the ONE place MiniMax stays available — appended as a
      // last-resort backstop for strict-JSON extraction. Chat never sets this.
      { json: true, temperature: 0.2, maxTokens: 1200, includeMinimax: true },
    );

    let facts: { text: string }[] = [];
    try {
      const parsed = JSON.parse(out) as { facts?: unknown };
      if (Array.isArray(parsed.facts)) {
        facts = parsed.facts
          .map((f) => f as Record<string, unknown>)
          .filter((f) => typeof f.text === "string" && (f.text as string).trim())
          .map((f) => ({ text: (f.text as string).trim().slice(0, 140) }))
          .slice(0, MAX_FACTS);
      }
    } catch {
      // Model broke strict JSON (observed transiently with MiniMax) — salvage
      // the "text" fields instead of returning an empty import to the user.
      for (const m of out.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
        const t = m[1].replace(/\\"/g, '"').replace(/\\n/g, " ").trim();
        if (t) facts.push({ text: t.slice(0, 140) });
        if (facts.length >= MAX_FACTS) break;
      }
    }

    return NextResponse.json({ facts, provider });
  } catch (e) {
    const message = e instanceof Error ? e.message : "import extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

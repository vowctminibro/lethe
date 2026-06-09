import { NextRequest, NextResponse } from "next/server";
import { complete, type ChatMessage } from "@/src/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST { messages: {role,content}[], context?: string[] }
 *   -> { reply, remember: {text,kind}|null, provider }
 *
 * The real Lethe brain. We inject recalled memories (`context`) as grounding,
 * run the chat through the free LLM chain (Groq → Gemini), and ask the model to
 * ALSO decide — in the same JSON turn — whether the user just revealed a new
 * durable fact worth remembering. The client owns the actual on-chain write
 * (it signs with the user's zkLogin), so this route never touches a key or chain.
 */

const KINDS = ["trading-style", "market-view", "holding", "preference", "fact"] as const;

function systemPrompt(context: string[]): string {
  const memo =
    context.length > 0
      ? `What you already remember about this user (their owned, on-chain memory):\n${context
          .map((c) => `- ${c}`)
          .join("\n")}`
      : "You have no memories about this user yet.";

  return [
    "You are Lethe — a crypto-native AI agent. Your defining trait: your memory of",
    "the user is OWNED BY THEM, encrypted on Walrus and referenced on a Sui object",
    "they control. You are sharp, concise, and fluent in crypto/DeFi/trading.",
    "",
    "Use the remembered facts below as context to personalize every reply. If the",
    "user states a new durable fact about their style, holdings, market view, or",
    "preferences (NOT a question, NOT small talk), capture it to remember.",
    "",
    memo,
    "",
    "Respond ONLY with a JSON object of this exact shape:",
    '{ "reply": string, "remember": { "text": string, "kind": string } | null }',
    "",
    "- `reply`: your natural-language answer to the user (1-4 sentences).",
    "- `remember`: a NEW durable fact to store, or null. Set it only when the user",
    "  reveals something stable about themselves worth recalling later. Rewrite it",
    "  as a clean first-person/third-person fact (e.g. \"Trades momentum, avoids",
    "  leverage\"). Do NOT re-remember something already in the context above.",
    `- \`kind\` must be one of: ${KINDS.join(", ")}.`,
  ].join("\n");
}

interface ParsedReply {
  reply: string;
  remember: { text: string; kind: string } | null;
}

function parseModel(raw: string): ParsedReply {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    // Model didn't honor JSON — treat the whole thing as the reply, remember nothing.
    return { reply: raw.trim(), remember: null };
  }
  const o = obj as Record<string, unknown>;
  const reply = typeof o.reply === "string" && o.reply.trim() ? o.reply.trim() : raw.trim();
  let remember: ParsedReply["remember"] = null;
  const r = o.remember as Record<string, unknown> | null | undefined;
  if (r && typeof r.text === "string" && r.text.trim()) {
    const kind = typeof r.kind === "string" && (KINDS as readonly string[]).includes(r.kind)
      ? r.kind
      : "fact";
    remember = { text: r.text.trim(), kind };
  }
  return { reply, remember };
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "missing messages[]" }, { status: 400 });
    }
    const ctx: string[] = Array.isArray(context) ? context.filter((c) => typeof c === "string") : [];

    const turns: ChatMessage[] = (messages as ChatMessage[])
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content }));

    const llmMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt(ctx) },
      ...turns,
    ];

    const { text, provider } = await complete(llmMessages, { json: true, temperature: 0.5 });
    const parsed = parseModel(text);
    return NextResponse.json({ ...parsed, provider });
  } catch (e) {
    const message = e instanceof Error ? e.message : "chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

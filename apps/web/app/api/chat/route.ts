import { NextRequest, NextResponse } from "next/server";
import { streamComplete, type ChatMessage } from "@/src/lib/llm";
import { takeToken } from "@/src/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST { messages: {role,content}[], context?: string[], walletContext?: string[], greet?: boolean }
 *   -> token stream (text/plain), model id in the `x-provider` header.
 *
 * The Lethe reply plane. Recalled memories (`context`) ground the reply;
 * `walletContext` is the optional read-only snapshot of a linked wallet,
 * injected as flavor. Durable-fact extraction is a separate call
 * (/api/chat/extract) so the reply can stream token-by-token.
 *
 * `greet: true` is the returning-user opener: `messages` may be empty and the
 * reply is a short personal greeting woven from 1–2 remembered facts.
 */

const GREET_INSTRUCTION = [
  "The user just opened the chat and you DO remember them. Greet them back in",
  "2-3 SHORT sentences, max. Weave in exactly ONE of the remembered facts below,",
  "framed as something that is still theirs — they own it, you kept it for them",
  "(you may note once, lightly, that it's saved on Walrus / owned by them). Do NOT",
  "list or enumerate the memories, never say \"according to my memory\". End with one",
  "short, open nudge. Warm and plain — no crypto lecture, no preamble.",
].join(" ");

function systemPrompt(context: string[], wallet: string[]): string {
  const memo =
    context.length > 0
      ? `What you already remember about this user (their owned, on-chain memory):\n${context
          .map((c) => `- ${c}`)
          .join("\n")}`
      : "You have no memories about this user yet.";

  const walletBlock =
    wallet.length > 0
      ? `\nRead-only snapshot of a wallet the user linked (use as flavor, don't over-quote):\n${wallet
          .map((l) => `- ${l}`)
          .join("\n")}\n`
      : "";

  return [
    "You are Lethe — a crypto-native AI agent. Your defining trait: your memory of",
    "the user is OWNED BY THEM, encrypted on Walrus and referenced on a Sui object",
    "they control. You are sharp and concise, fluent in crypto/DeFi/trading when it",
    "is relevant.",
    "",
    "Use the remembered facts below to personalize every reply. When the user",
    "shares something durable about themselves, acknowledge it naturally — the app",
    "persists it for you, so never claim you can't remember things.",
    "",
    memo,
    walletBlock,
    "STYLE: Match the user's language and register — if they write in Thai, reply in",
    "Thai; if they're brief, be brief. Keep replies SHORT (1-3 sentences) and let the",
    "user lead — do not volunteer long explanations or unprompted crypto/DeFi lectures.",
    "A bare hello gets a brief, friendly hello back, not a paragraph. Plain natural",
    "language, no JSON, no markdown headers.",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context, walletContext, greet, model, address } = await req.json();
    const prefer = typeof model === "string" && model ? model : undefined;

    // Soft per-address (fallback: per-IP) limit on the LLM plane only —
    // memory routes are never limited. See src/lib/rate-limit.ts.
    const limitKey =
      (typeof address === "string" && address) ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "anon";
    if (!takeToken(limitKey)) {
      return NextResponse.json(
        { error: "Easy there — chat is rate-limited on the free demo. Your memory features all still work; try again in a minute." },
        { status: 429 },
      );
    }
    const greeting = greet === true;
    if (!greeting && (!Array.isArray(messages) || messages.length === 0)) {
      return NextResponse.json({ error: "missing messages[]" }, { status: 400 });
    }
    const ctx: string[] = Array.isArray(context) ? context.filter((c) => typeof c === "string") : [];
    const wallet: string[] = Array.isArray(walletContext)
      ? walletContext.filter((c) => typeof c === "string")
      : [];
    if (greeting && ctx.length === 0) {
      return NextResponse.json({ error: "greet requires context" }, { status: 400 });
    }

    const turns: ChatMessage[] = greeting
      ? [{ role: "user", content: GREET_INSTRUCTION }]
      : (messages as ChatMessage[])
          .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .map((m) => ({ role: m.role, content: m.content }));

    const { stream, provider } = await streamComplete(
      [{ role: "system", content: systemPrompt(ctx, wallet) }, ...turns],
      { temperature: greeting ? 0.7 : 0.5, maxTokens: greeting ? 160 : 500, prefer },
    );

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const token of stream) controller.enqueue(encoder.encode(token));
        } catch {
          // Mid-stream drop: end what we have; the client shows the partial reply.
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "x-provider": provider,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

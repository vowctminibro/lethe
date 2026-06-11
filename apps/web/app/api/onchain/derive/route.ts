import { NextRequest, NextResponse } from "next/server";
import { getSuiClient } from "@/src/lib/sui";
import { readActivity, activityToPrompt } from "@/src/lib/onchain/activity";
import { complete } from "@/src/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST { address } -> { summary, entries: {text,kind}[], provider }
 *
 * The WEDGE endpoint. Reads `address`'s real on-chain activity (read-only RPC),
 * then asks the free LLM to DERIVE durable memories from it — facts the user
 * never typed. The client persists each returned entry via the same gasless
 * remember() loop, so derived memories land on Walrus + the owned Memory object
 * exactly like chat-stated ones, tagged so the UI can show they came from chain.
 */

const KINDS = ["trading-style", "market-view", "holding", "preference", "fact"] as const;

const SYSTEM = [
  "You are Lethe analyzing a user's REAL on-chain activity on Sui. From the",
  "snapshot below, infer durable STYLE TRAITS about this user as a crypto",
  "participant — what they hold, how active they are, what kinds of protocols",
  "they touch. Be specific, cite the numbers you see, and do NOT invent",
  "anything not supported by the data.",
  "",
  "Respond ONLY with a JSON object: { \"entries\": [ { \"text\": string, \"kind\": string } ] }",
  "- 2 to 4 entries, each a trait card: a short label, then the evidence.",
  "  e.g. \"Momentum-leaning: 14 swap txs in the recent sample\" or",
  "  \"Builder profile: publishes Move packages and holds UpgradeCaps\" or",
  "  \"NFT collector: 12 collectibles incl. 'Khun Tum'\".",
  `- \`kind\` one of: ${KINDS.join(", ")}.`,
  "- Quality over quantity — only traits the data actually supports.",
].join("\n");

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (typeof address !== "string" || !/^0x[0-9a-fA-F]+$/.test(address)) {
      return NextResponse.json({ error: "missing/invalid address" }, { status: 400 });
    }

    const activity = await readActivity(getSuiClient(), address);
    const summary = activityToPrompt(activity);

    // Empty/boring wallet: be graceful and honest — no LLM, no fabricated traits.
    if (
      activity.recentTxCount === 0 &&
      activity.holdings.length === 0 &&
      activity.ownedObjectCount === 0
    ) {
      return NextResponse.json({ summary, entries: [], inactive: true, provider: "none" });
    }

    const { text, provider } = await complete(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: `On-chain snapshot:\n${summary}` },
      ],
      { json: true, temperature: 0.3, maxTokens: 500 },
    );

    let entries: { text: string; kind: string }[] = [];
    try {
      const parsed = JSON.parse(text) as { entries?: unknown };
      if (Array.isArray(parsed.entries)) {
        entries = parsed.entries
          .map((e) => e as Record<string, unknown>)
          .filter((e) => typeof e.text === "string" && (e.text as string).trim())
          .map((e) => ({
            text: (e.text as string).trim(),
            kind:
              typeof e.kind === "string" && (KINDS as readonly string[]).includes(e.kind as string)
                ? (e.kind as string)
                : "fact",
          }))
          .slice(0, 4);
      }
    } catch {
      /* model didn't return JSON — fall through to empty */
    }

    if (entries.length === 0) {
      return NextResponse.json({ summary, entries, inactive: true, provider });
    }

    return NextResponse.json({ summary, entries, inactive: false, provider });
  } catch (e) {
    const message = e instanceof Error ? e.message : "derive failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

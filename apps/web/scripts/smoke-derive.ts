import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { readActivity, activityToPrompt } from "../src/lib/onchain/activity";
import { complete } from "../src/lib/llm/index";

// EXACT copy of the SYSTEM prompt + parsing from app/api/onchain/derive/route.ts
const KINDS = ["trading-style", "market-view", "holding", "preference", "fact"] as const;
const SYSTEM = [
  "You are Lethe analyzing a user's REAL on-chain activity on Sui. From the",
  "snapshot below, infer durable, useful facts about this user as a crypto",
  "participant — what they hold, how active they are, what kinds of protocols",
  "they touch. Be specific but do NOT invent anything not supported by the data.",
  "",
  'Respond ONLY with a JSON object: { "entries": [ { "text": string, "kind": string } ] }',
  "- 2 to 5 entries.",
  '- `text`: a concise third-person fact (e.g. "Holds mostly SUI; ~40 recent txs,',
  '  an active on-chain user" or "Interacts with DeepBook — trades on-chain").',
  `- \`kind\` one of: ${KINDS.join(", ")}.`,
  "- If the address is essentially empty/inactive, return a single honest entry",
  '  saying so with kind "fact".',
].join("\n");

function parseEntries(text: string) {
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
        .slice(0, 5);
    }
  } catch {}
  if (entries.length === 0) entries = [{ text: "On-chain activity analyzed; no strong signals derived.", kind: "fact" }];
  return entries;
}

async function deriveFor(label: string, network: "testnet" | "mainnet", address: string) {
  console.log(`\n================ ${label} (${network}) ================`);
  console.log("address:", address);
  const client = new SuiJsonRpcClient({ network, url: getJsonRpcFullnodeUrl(network) });
  const activity = await readActivity(client, address);
  console.log("--- ACTIVITY SNAPSHOT ---");
  console.log(JSON.stringify(activity, null, 2));
  const summary = activityToPrompt(activity);
  const { text, provider } = await complete(
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: `On-chain snapshot:\n${summary}` },
    ],
    { json: true, temperature: 0.3, maxTokens: 500 },
  );
  console.log("--- DERIVED ENTRIES (provider:", provider, ") ---");
  console.log(JSON.stringify(parseEntries(text), null, 2));
}

async function main() {
  const addr = process.argv[2] || "0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077";
  const net = (process.argv[3] as "testnet" | "mainnet") || "testnet";
  await deriveFor("ACTIVE WALLET", net, addr);
}
main().catch((e) => { console.error("DERIVE SMOKE FAILED:", e instanceof Error ? e.message : e); process.exit(1); });

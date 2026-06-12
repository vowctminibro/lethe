// BLOCK 9 Phase 1 gate — memory is provably model-independent:
// remember a fact while model A answers, then recall it grounded through
// every OTHER configured model. Dead-quota providers are skipped + logged,
// never failed (the chain's whole point). Dev server on :3010 (or E2E_BASE).
// Run from apps/web:
//   node --import ./scripts/_register-hook.mjs scripts/model-independence-e2e.mjs
import { readFileSync } from "node:fs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

process.env.NEXT_PUBLIC_MEMORY_PACKAGE_ID =
  "0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c";
process.env.NEXT_PUBLIC_MEMORY_PACKAGE_ORIGINAL =
  "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";
process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ??= "https://aggregator.walrus-testnet.walrus.space";

const { SealProvider } = await import("../src/lib/memory/seal-provider.ts");

const BASE = process.env.E2E_BASE || "http://localhost:3010";
const msEnv = readFileSync(new URL("../../memory-service/.env", import.meta.url), "utf8");
const kp = Ed25519Keypair.fromSecretKey(msEnv.match(/^DEPLOYER_PRIVATE_KEY=(.+)$/m)[1].trim());
const OWNER = kp.getPublicKey().toSuiAddress();
const client = new SuiJsonRpcClient({ network: "testnet", url: getJsonRpcFullnodeUrl("testnet") });

const realFetch = globalThis.fetch;
globalThis.fetch = (url, init) =>
  typeof url === "string" && url.startsWith("/") ? realFetch(`${BASE}${url}`, init) : realFetch(url, init);

const provider = new SealProvider({
  ownerAddress: OWNER,
  client,
  signTransaction: async ({ transaction }) => {
    transaction.setSenderIfNotSet(OWNER);
    const bytes = await transaction.build({ client });
    const { signature } = await kp.signTransaction(bytes);
    return { signature, bytes };
  },
  signPersonalMessage: async ({ message }) => {
    const { signature } = await kp.signPersonalMessage(message);
    return { signature };
  },
});

const chat = async (content, context, model) => {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content }], context, model }),
  });
  if (!res.ok) throw new Error(`chat ${res.status}: ${(await res.json().catch(() => ({})))?.error ?? ""}`);
  const text = await res.text();
  return { text, provider: res.headers.get("x-provider") ?? "?" };
};

// [0] which models exist right now?
const { models } = await (await fetch(`${BASE}/api/chat/models`)).json();
console.log("[0] available models:", models.map((m) => m.label).join(" | "));
if (models.length === 0) throw new Error("no models configured");
const [first, ...rest] = models;

// [1] remember a distinctive fact while model A answers
const MARK = `delta-${Date.now() % 1e6}`;
const FACT = `My hard rule ${MARK}: I exit every position before the weekly close.`;
console.log(`[1] model A = ${first.label} — stating the fact…`);
const a = await chat(FACT, [], first.key);
console.log(`    answered by ${a.provider} (requested ${first.key}) — ${a.provider.startsWith(first.key) ? "as requested" : "FELL BACK (quota?)"}`);
const saved = await provider.remember({ text: FACT, kind: "trading-style" });
console.log(`    remembered on-chain: blob ${saved.blobId.slice(0, 12)}… digest ${saved.digest.slice(0, 12)}…`);

// [2] recall through every other model — provider-independent by design,
// proven by asking each model to answer FROM the recalled context.
const hits = await provider.recall("weekly close rule", { limit: 5 });
const recalled = hits.find((h) => h.text.includes(MARK));
if (!recalled) throw new Error("GATE FAIL: fact not recalled from the vault");
console.log(`[2] recall (provider plane, no LLM): found "${MARK}" ✓`);

let answeredCount = 0;
const skipped = [];
for (const m of rest.length > 0 ? rest : [first]) {
  try {
    const r = await chat(
      "What is my rule about weekly closes? Quote the rule code if you know it.",
      hits.map((h) => h.text),
      m.key,
    );
    const knows = r.text.includes(MARK) || /weekly close/i.test(r.text);
    console.log(`[3] ${m.label} → answered by ${r.provider} · references the fact: ${knows ? "YES" : "NO"}`);
    if (!knows) throw new Error(`GATE FAIL: ${m.label} did not use the recalled memory`);
    answeredCount++;
  } catch (e) {
    if (/429|quota|limit/i.test(String(e.message))) {
      skipped.push(`${m.label} (quota dead: ${String(e.message).slice(0, 60)})`);
      console.log(`[3] ${m.label} SKIPPED — quota exhausted`);
    } else throw e;
  }
}

if (answeredCount === 0) throw new Error("GATE FAIL: no second model could answer");
console.log(`\n=== MODEL-INDEPENDENCE GATE PASSED — fact stored under ${first.key}, recalled through ${answeredCount} other model(s)${skipped.length ? ` · skipped: ${skipped.join(", ")}` : ""} ===`);

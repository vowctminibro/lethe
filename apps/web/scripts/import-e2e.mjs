// BLOCK 9 ADDENDUM gate — Import memory from another AI:
// 5-fact paste → extraction → remember() loop with kind="imported" →
// ≥4 entries on-chain → recall hits an imported fact → export JSON includes
// kind="imported". Mirrors /memory's runImport() exactly.
// Dev server on :3010 (or E2E_BASE). Run from apps/web:
//   node --import ./scripts/_register-hook.mjs scripts/import-e2e.mjs
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

// A realistic ChatGPT "what do you remember about me" answer — 5 facts.
const MARK = `imp${Date.now() % 1e6}`;
const PASTE = `Here's what I remember about you from our conversations:

1. You're a software developer based in Bangkok working on blockchain projects (ref ${MARK}).
2. You prefer dark roast coffee and usually code late at night.
3. You trade crypto with strict risk rules — you never use more than 5x leverage.
4. You're learning the Move programming language for Sui development.
5. You have a golden retriever named Mochi.

Let me know if any of this is out of date!`;

console.log("[1] extraction (the import-extract route)…");
const ex = await fetch(`${BASE}/api/memory/import-extract`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: PASTE }),
});
if (!ex.ok) throw new Error(`extract failed: ${ex.status}`);
const { facts, provider: llm } = await ex.json();
console.log(`    ${facts.length} facts via ${llm}`);
facts.forEach((f) => console.log(`    - ${f.text}`));
if (facts.length < 4) throw new Error(`IMPORT GATE FAIL: ${facts.length} facts from a 5-fact paste`);

console.log("[2] remember() loop, kind=\"imported\" (gasless, Seal-encrypted)…");
let written = 0;
for (const f of facts) {
  await provider.remember({ text: f.text, kind: "imported" });
  written++;
}
console.log(`    ${written} entries written on-chain`);

console.log("[3] recall hits an imported fact…");
const hits = await provider.recall("");
const imported = hits.filter((h) => h.kind === "imported");
const hasMark = imported.some((h) => h.text.includes(MARK));
const dog = imported.some((h) => /mochi/i.test(h.text));
console.log(`    imported entries recalled: ${imported.length} · marker found: ${hasMark} · dog fact: ${dog}`);
if (imported.length < 4 || !(hasMark || dog)) throw new Error("IMPORT GATE FAIL: imported facts not recalled");

console.log("[4] export payload includes kind=\"imported\"…");
const payload = {
  note: "Exported from Lethe — your memory, your file.",
  owner: OWNER,
  entries: hits.map((h) => ({ text: h.text, kind: h.kind, blobId: h.blobId, createdAtMs: h.createdAtMs })),
};
const json = JSON.stringify(payload);
const count = (json.match(/"kind":"imported"/g) ?? []).length;
console.log(`    "kind":"imported" × ${count} in export JSON`);
if (count < 4) throw new Error("IMPORT GATE FAIL: export missing imported entries");

console.log(`\n=== IMPORT GATE PASSED — ${facts.length} facts pasted → ${written} owned memories → recalled + exported ===`);

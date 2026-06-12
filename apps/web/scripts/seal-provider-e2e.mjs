// BLOCK 8 Phase 3 gate — write + recall through the REAL SealProvider code
// path on testnet (the exact same src/lib/memory modules the browser runs,
// loaded via the TS register hook). Deployer keypair stands in for zkLogin.
// Dev server must be up on :3010 (provides /api/memory/store + sponsor).
// Run from apps/web:
//   node --import ./scripts/_register-hook.mjs scripts/seal-provider-e2e.mjs
import { readFileSync } from "node:fs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

// Env BEFORE importing src modules (chain.ts reads at import time).
process.env.NEXT_PUBLIC_MEMORY_PACKAGE_ID =
  "0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c"; // v3
process.env.NEXT_PUBLIC_MEMORY_PACKAGE_ORIGINAL =
  "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";
process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ??= "https://aggregator.walrus-testnet.walrus.space";

const { SealProvider } = await import("../src/lib/memory/seal-provider.ts");

const BASE = process.env.E2E_BASE || "http://localhost:3010";
const msEnv = readFileSync(new URL("../../memory-service/.env", import.meta.url), "utf8");
const SK = msEnv.match(/^DEPLOYER_PRIVATE_KEY=(.+)$/m)?.[1]?.trim();
const kp = Ed25519Keypair.fromSecretKey(SK);
const OWNER = kp.getPublicKey().toSuiAddress();
const client = new SuiJsonRpcClient({ network: "testnet", url: getJsonRpcFullnodeUrl("testnet") });

// Node has no window/fetch-relative-URL — shim app-relative fetches to :3010.
const realFetch = globalThis.fetch;
globalThis.fetch = (url, init) =>
  typeof url === "string" && url.startsWith("/") ? realFetch(`${BASE}${url}`, init) : realFetch(url, init);

const provider = new SealProvider({
  ownerAddress: OWNER,
  client,
  // Node stand-ins for the dapp-kit signers — same signature shapes.
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

const FACT = `Block 8 seal e2e — sizes positions by volatility, never by conviction (${Date.now() % 100000})`;

console.log("[1] SealProvider.remember (client-side Seal encrypt → store → gasless add_entry)…");
const res = await provider.remember({ text: FACT, kind: "trading-style" });
console.log(`    blobId=${res.blobId}`);
console.log(`    gasless add_entry digest=${res.digest} sponsor=${res.gasOwner ?? "?"}`);

console.log("[2] verify the blob is Seal ciphertext (server cannot read it)…");
const aggRes = await fetch(
  `${process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL}/v1/blobs/${encodeURIComponent(res.blobId)}`,
);
const bytes = new Uint8Array(await aggRes.arrayBuffer());
const { EncryptedObject } = await import("@mysten/seal");
const parsed = EncryptedObject.parse(bytes);
console.log(`    aggregator ${aggRes.status} · ${bytes.length} B · Seal services=${parsed.services.length} · id prefix matches vault: ${parsed.id.startsWith(res.memoryId.slice(2))}`);

console.log("[3] SealProvider.recall (SessionKey + seal_approve → decrypt)…");
const hits = await provider.recall("how do I size positions?", { limit: 8 });
const hit = hits.find((h) => h.blobId === res.blobId);
console.log(`    ${hits.length} hits · new seal entry recalled: ${hit ? "YES" : "NO"}`);
if (hit) console.log(`    text: ${JSON.stringify(hit.text)}`);
console.log(`    legacy (AES) entries still readable: ${hits.filter((h) => h.blobId !== res.blobId).length}`);

if (!hit || hit.text !== FACT) throw new Error("GATE FAIL: seal entry not recalled verbatim");
console.log("\n=== SEAL PROVIDER E2E GATE PASSED (write + mixed-mode recall on testnet) ===");

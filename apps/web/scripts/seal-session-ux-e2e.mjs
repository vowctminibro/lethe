// BLOCK 8 Phase 4 gate — the "returning user" UX contract, measured:
// remember + THREE recalls through SealProvider must cost AT MOST ONE
// personal-message signature (SessionKey cache + in-flight dedupe), and
// every write stays gasless (sponsor pays, not the user).
// Dev server on :3010. Run from apps/web:
//   node --import ./scripts/_register-hook.mjs scripts/seal-session-ux-e2e.mjs
import { readFileSync } from "node:fs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

process.env.NEXT_PUBLIC_MEMORY_PACKAGE_ID =
  "0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c";
process.env.NEXT_PUBLIC_MEMORY_PACKAGE_ORIGINAL =
  "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";
process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ??= "https://aggregator.walrus-testnet.walrus.space";

const { SealProvider } = await import("../src/lib/memory/seal-provider.ts");

const BASE = "http://localhost:3010";
const msEnv = readFileSync(new URL("../../memory-service/.env", import.meta.url), "utf8");
const kp = Ed25519Keypair.fromSecretKey(msEnv.match(/^DEPLOYER_PRIVATE_KEY=(.+)$/m)[1].trim());
const OWNER = kp.getPublicKey().toSuiAddress();
const client = new SuiJsonRpcClient({ network: "testnet", url: getJsonRpcFullnodeUrl("testnet") });

const realFetch = globalThis.fetch;
globalThis.fetch = (url, init) =>
  typeof url === "string" && url.startsWith("/") ? realFetch(`${BASE}${url}`, init) : realFetch(url, init);

let signatureCount = 0;
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
    signatureCount++;
    const { signature } = await kp.signPersonalMessage(message);
    return { signature };
  },
});

console.log("[1] remember (gasless write — no session signature needed)…");
const res = await provider.remember({
  text: `UX gate fact ${Date.now() % 100000} — checks DEX depth before any entry`,
  kind: "trading-style",
});
console.log(`    digest=${res.digest.slice(0, 14)}… sponsor=${(res.gasOwner ?? "?").slice(0, 14)}…`);
const gaslessOk = res.gasOwner !== null && res.gasOwner !== OWNER;
console.log(`    gasless (sponsor ≠ signer): ${gaslessOk}`);
console.log(`    signatures so far: ${signatureCount} (expected 0 — writes never need the decrypt key)`);

console.log("[2] recall ×3 — first decrypt signs once, rest ride the cache…");
// Parallel pair first: the in-flight dedupe must collapse them to one signing.
const [a, b] = await Promise.all([provider.recall("trading style"), provider.recall("")]);
const c = await provider.recall("dex depth", { limit: 3 });
console.log(`    hits: ${a.length} / ${b.length} / ${c.length}`);
console.log(`    total personal-message signatures: ${signatureCount}`);

if (signatureCount > 1) throw new Error(`UX GATE FAIL: ${signatureCount} signatures (max 1 allowed)`);
if (!gaslessOk) throw new Error("UX GATE FAIL: write was not sponsored");
if (!c.length) throw new Error("UX GATE FAIL: recall empty");
console.log("\n=== SEAL UX GATE PASSED — 1 signature for the whole session, writes gasless ===");

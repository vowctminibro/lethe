// BLOCK 8 follow-up gate — PULSE-IN-SEAL (the money shot, proven in node).
//
// Question this answers: in NEXT_PUBLIC_MEMORY_PROVIDER=seal, does the /pulse
// surface actually end up SHOWING the user's memories, or does B17 leave it
// holding ciphertext it can't read?
//
// It proves the EXACT path pulse/page.tsx runs:
//   1. SealProvider.remember        → a fresh Seal blob lands in the vault.
//   2. provider.grant(PULSE)         → on-chain authorize (gasless, owner-only).
//   3. POST /api/pulse/recall        → server enforces the grant gate AND
//                                      returns the seal blob flagged sealed:true
//                                      with text:"" (server CANNOT read it — the
//                                      whole point of Seal mode).
//   4. SealProvider.recall("")       → owner SessionKey decrypts the sealed
//      + merge by blobId               blobs in-session; the page merges them by
//                                      blobId — exactly the code in page.tsx.
//      → the sealed entry now resolves to its verbatim plaintext = WORKS.
//   5. provider.revoke(PULSE)        → /api/pulse/recall returns 403, 0 entries
//                                      (revoke = forget still server-enforced).
//
// Deployer keypair stands in for zkLogin (same signature shapes). Dev server
// must be up on :3010 in seal mode (provides /api/pulse/recall, /api/memory/store,
// /api/sponsor). Run from apps/web:
//   node --import ./scripts/_register-hook.mjs scripts/pulse-seal-e2e.mjs
import { readFileSync } from "node:fs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

// Env BEFORE importing src modules (chain.ts/seal.ts read at import time).
process.env.NEXT_PUBLIC_MEMORY_PROVIDER = "seal";
process.env.NEXT_PUBLIC_MEMORY_PACKAGE_ID =
  "0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c"; // v3
process.env.NEXT_PUBLIC_MEMORY_PACKAGE_ORIGINAL =
  "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";
process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ??= "https://aggregator.walrus-testnet.walrus.space";

const { SealProvider } = await import("../src/lib/memory/seal-provider.ts");
const { PULSE_APP_ADDRESS } = await import("../src/lib/pulse.ts");

const BASE = process.env.E2E_BASE || "http://localhost:3010";
const msEnv = readFileSync(new URL("../../memory-service/.env", import.meta.url), "utf8");
const SK = msEnv.match(/^DEPLOYER_PRIVATE_KEY=(.+)$/m)?.[1]?.trim();
const kp = Ed25519Keypair.fromSecretKey(SK);
const OWNER = kp.getPublicKey().toSuiAddress();
const client = new SuiJsonRpcClient({ network: "testnet", url: getJsonRpcFullnodeUrl("testnet") });

// Node has no window/relative-URL fetch — shim app-relative fetches to BASE.
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

async function pulseRecall(label) {
  const res = await realFetch(`${BASE}/api/pulse/recall`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerAddress: OWNER }),
  });
  const body = await res.json().catch(() => ({}));
  console.log(`    ${label}: HTTP ${res.status} entries=${body.entries?.length ?? 0}${body.error ? ` error="${body.error}"` : ""}`);
  return { status: res.status, entries: body.entries ?? [] };
}

const FACT = `Pulse-in-seal e2e — only ever holds spot, never leverage (${Date.now() % 100000})`;

console.log("[1] SealProvider.remember (client-side Seal encrypt → store → gasless add_entry)…");
const stored = await provider.remember({ text: FACT, kind: "trading-style" });
console.log(`    fresh seal blobId=${stored.blobId}`);

console.log("\n[2] grant Pulse (gasless, owner-only on chain)…");
const g = await provider.grant(PULSE_APP_ADDRESS);
console.log(`    grant digest=${g.digest}`);
await new Promise((r) => setTimeout(r, 2000)); // let the grant settle on chain

console.log("\n[3] /api/pulse/recall — server enforces grant + returns SEAL blobs it cannot read…");
const granted = await pulseRecall("granted");
const sealedRow = granted.entries.find((e) => e.blobId === stored.blobId);
const serverCannotRead = sealedRow && sealedRow.sealed === true && (sealedRow.text ?? "") === "";
console.log(`    fresh blob present=${!!sealedRow} sealed=${sealedRow?.sealed} server-text="${sealedRow?.text ?? "<none>"}"`);
console.log(`    → server returns ciphertext-flagged, unreadable: ${serverCannotRead ? "YES (B17 security property holds)" : "NO"}`);

console.log("\n[4] owner SessionKey decrypts the sealed blobs (the merge pulse/page.tsx does)…");
const hits = await provider.recall("", { limit: 50 });
const byBlob = new Map(hits.map((h) => [h.blobId, h.text]));
const merged = granted.entries
  .map((e) => (e.sealed ? { ...e, text: byBlob.get(e.blobId) ?? "" } : e))
  .filter((e) => e.text);
const decrypted = merged.find((e) => e.blobId === stored.blobId);
console.log(`    owner-session recall hits=${hits.length} · merged readable entries=${merged.length}`);
console.log(`    fresh entry after merge: ${decrypted ? JSON.stringify(decrypted.text) : "<MISSING>"}`);
const readsBack = decrypted?.text === FACT;
console.log(`    → Pulse shows the verbatim memory: ${readsBack ? "YES" : "NO"}`);

console.log("\n[5] revoke Pulse (gasless) → /api/pulse/recall must refuse (revoke = forget)…");
const r = await provider.revoke(PULSE_APP_ADDRESS);
console.log(`    revoke digest=${r.digest}`);
await new Promise((res) => setTimeout(res, 2000));
const revoked = await pulseRecall("revoked");
const gateHolds = revoked.status === 403 && revoked.entries.length === 0;
console.log(`    → revoked surface refuses: ${gateHolds ? "YES (403, 0 entries)" : "NO"}`);

const pass = serverCannotRead && readsBack && gateHolds;
console.log(`\n=== PULSE-IN-SEAL E2E ${pass ? "GATE PASSED" : "GATE FAILED"} ===`);
console.log("    server can't read seal blobs :", serverCannotRead ? "✓" : "✗");
console.log("    owner session decrypts → shown:", readsBack ? "✓" : "✗");
console.log("    revoke still 403s          :", gateHolds ? "✓" : "✗");
console.log("vault entry on Walrus:", `${process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL}/v1/blobs/${stored.blobId}`);
if (!pass) process.exit(1);

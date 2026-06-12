// BLOCK 9 Phase 2 gate — export = exit. Reproduces /memory's exportMemory()
// pipeline exactly (owner-session Seal recall → JSON payload) against the dev
// wallet's real vault and asserts a known fact lands in the file.
// Dev server on :3010 (or E2E_BASE). Run from apps/web:
//   node --import ./scripts/_register-hook.mjs scripts/export-e2e.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

process.env.NEXT_PUBLIC_MEMORY_PACKAGE_ID =
  "0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c";
process.env.NEXT_PUBLIC_MEMORY_PACKAGE_ORIGINAL =
  "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";
process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ??= "https://aggregator.walrus-testnet.walrus.space";

const { SealProvider } = await import("../src/lib/memory/seal-provider.ts");
const { getOwnedMemory } = await import("../src/lib/memory/chain.ts");

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

// A fact known to live in the dev vault (written by seal-provider-e2e runs).
const KNOWN_FRAGMENT = "sizes positions by volatility";

console.log("[1] owner-session recall (the same path the Export button uses)…");
const chain = await getOwnedMemory(client, OWNER);
if (!chain) throw new Error("no vault for dev wallet");
const hits = await provider.recall("");
console.log(`    ${hits.length} entries decrypted client-side`);

// — exact mirror of app/memory/page.tsx exportMemory() —
const agg = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL;
const payload = {
  note: "Exported from Lethe — your memory, your file.",
  exportedAt: new Date().toISOString(),
  owner: OWNER,
  vaultId: chain.objectId,
  vaultUrl: `https://suiscan.xyz/testnet/object/${chain.objectId}`,
  entries: hits.map((h) => ({
    text: h.text,
    kind: h.kind,
    createdAtMs: h.createdAtMs,
    blobId: h.blobId,
    walrusUrl: `${agg}/v1/blobs/${encodeURIComponent(h.blobId)}`,
    suiscanObjectUrl: `https://suiscan.xyz/testnet/object/${chain.objectId}`,
  })),
};
const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const name = `/tmp/lethe-memory-${OWNER.slice(2, 8)}-${date}.json`;
writeFileSync(name, JSON.stringify(payload, null, 2));
console.log(`[2] wrote ${name} (${payload.entries.length} entries)`);

const onDisk = JSON.parse(readFileSync(name, "utf8"));
const found = onDisk.entries.some((e) => e.text.includes(KNOWN_FRAGMENT));
const shapeOk =
  onDisk.note.includes("your memory, your file") &&
  onDisk.vaultId.startsWith("0x") &&
  onDisk.entries.every((e) => e.text && e.kind && e.blobId && e.walrusUrl && e.createdAtMs);
console.log(`[3] known fact present: ${found} · payload shape complete: ${shapeOk}`);
if (!found || !shapeOk) throw new Error("EXPORT GATE FAIL");
console.log("\n=== EXPORT GATE PASSED — decrypted export with verifiable links ===");

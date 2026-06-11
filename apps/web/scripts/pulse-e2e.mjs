// Phase 4 gate: portability + revocation, real on testnet —
// grant Pulse (gasless) → /api/pulse/recall decrypts the vault's entries;
// revoke (gasless) → the same endpoint refuses with 403 and zero entries.
// Run from apps/web with the dev server up: node scripts/pulse-e2e.mjs
import { readFileSync } from "node:fs";
import { Transaction } from "@mysten/sui/transactions";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { toBase64, fromBase64 } from "@mysten/sui/utils";

// Latest package version (call target) vs original defining package (type filter).
const PKG = "0x06b5c99940b5de954b2b37cd1198f421921986eabd57b35fe3fd4cc39169ba95";
const TYPE_PKG = "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";
const PULSE = "0x00000000000000000000000000000000000000000000000000000070756c7365";
const BASE = "http://localhost:3010";

const msEnv = readFileSync(new URL("../../memory-service/.env", import.meta.url), "utf8");
const SK = msEnv.match(/^DEPLOYER_PRIVATE_KEY=(.+)$/m)?.[1]?.trim();
const kp = Ed25519Keypair.fromSecretKey(SK);
const SENDER = kp.getPublicKey().toSuiAddress();
const client = new SuiJsonRpcClient({ network: "testnet", url: getJsonRpcFullnodeUrl("testnet") });

const owned = await client.getOwnedObjects({
  owner: SENDER,
  filter: { StructType: `${TYPE_PKG}::memory::Memory` },
});
const memId = owned.data?.[0]?.data?.objectId;
if (!memId) throw new Error("no Memory vault owned by sender");
console.log("vault:", memId);

async function gasless(target, label) {
  const tx = new Transaction();
  tx.moveCall({ target: `${PKG}::memory::${target}`, arguments: [tx.object(memId), tx.pure.address(PULSE)] });
  tx.setSender(SENDER);
  const kind = await tx.build({ client, onlyTransactionKind: true });
  const cr = await fetch(`${BASE}/api/sponsor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", sender: SENDER, transactionKindBytes: toBase64(kind) }),
  });
  if (!cr.ok) throw new Error(`${label} sponsor create failed: ${cr.status} ${await cr.text()}`);
  const { bytes, digest } = await cr.json();
  const { signature } = await kp.signTransaction(fromBase64(bytes));
  const er = await fetch(`${BASE}/api/sponsor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "execute", digest, signature }),
  });
  if (!er.ok) throw new Error(`${label} sponsor execute failed: ${er.status} ${await er.text()}`);
  const { digest: fin } = await er.json();
  await new Promise((r) => setTimeout(r, 1800));
  const tb = await client.getTransactionBlock({ digest: fin, options: { showEffects: true, showInput: true } });
  const gasOwner = tb.transaction?.data?.gasData?.owner;
  console.log(`${label}: status=${tb.effects?.status?.status} gasless=${gasOwner !== SENDER ? "YES" : "NO"} tx=${fin}`);
  return fin;
}

async function pulseRecall(label) {
  const res = await fetch(`${BASE}/api/pulse/recall`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerAddress: SENDER }),
  });
  const body = await res.json().catch(() => ({}));
  console.log(`${label}: HTTP ${res.status} entries=${body.entries?.length ?? 0}${body.error ? ` error="${body.error}"` : ""}`);
  if (res.status === 200) for (const e of body.entries) console.log(`    - [${e.kind}] ${e.text}`);
  return { status: res.status, count: body.entries?.length ?? 0 };
}

console.log("\n[0] baseline (expect 403 — never granted)…");
const base = await pulseRecall("    pulse/recall");

console.log("\n[1] grant Pulse (gasless)…");
const grantTx = await gasless("grant", "    grant");

console.log("\n[2] Pulse reads the vault…");
const grantedRead = await pulseRecall("    pulse/recall");

console.log("\n[3] revoke Pulse (gasless)…");
await gasless("revoke", "    revoke");

console.log("\n[4] Pulse reads again (expect 403, zero entries)…");
const revokedRead = await pulseRecall("    pulse/recall");

const pass =
  base.status === 403 &&
  grantedRead.status === 200 &&
  grantedRead.count > 0 &&
  revokedRead.status === 403 &&
  revokedRead.count === 0;
console.log(`\n=== PULSE E2E ${pass ? "GATE PASSED" : "GATE FAILED"} ===`);
console.log("vault:    ", `https://suiscan.xyz/testnet/object/${memId}`);
console.log("grant tx: ", `https://suiscan.xyz/testnet/tx/${grantTx}`);
if (!pass) process.exit(1);

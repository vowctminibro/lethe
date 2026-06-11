// Block 5 Step 3 gate: the full forget round-trip, no mock —
// remember (encrypt → Walrus → gasless add_entry) → gasless remove_entry →
// recall excludes the fact → on-chain entries length is back to the baseline.
// Uses the funded deployer key as the "user" signer (same stand-in as
// hero-e2e.mjs). Run from apps/web with the dev server up on :3010.
import { readFileSync } from "node:fs";
import { Transaction } from "@mysten/sui/transactions";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { toBase64, fromBase64 } from "@mysten/sui/utils";

// Latest package version (call target) vs original defining package (type filter).
const PKG = "0x06b5c99940b5de954b2b37cd1198f421921986eabd57b35fe3fd4cc39169ba95";
const TYPE_PKG = "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";
const BASE = "http://localhost:3010";

const msEnv = readFileSync(new URL("../../memory-service/.env", import.meta.url), "utf8");
const SK = msEnv.match(/^DEPLOYER_PRIVATE_KEY=(.+)$/m)?.[1]?.trim();
const kp = Ed25519Keypair.fromSecretKey(SK);
const SENDER = kp.getPublicKey().toSuiAddress();
const client = new SuiJsonRpcClient({ network: "testnet", url: getJsonRpcFullnodeUrl("testnet") });

const FACT = `Forget-me test fact ${Date.now()} — strictly ephemeral.`;

async function sponsorExecute(tx, label) {
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
  return (await er.json()).digest;
}

async function readVault(memId) {
  const obj = await client.getObject({ id: memId, options: { showContent: true } });
  const entries = (obj.data?.content?.fields?.entries ?? []).map((e) => e.fields ?? e);
  return entries;
}

// [0] locate the vault + baseline
const owned = await client.getOwnedObjects({
  owner: SENDER,
  filter: { StructType: `${TYPE_PKG}::memory::Memory` },
  options: { showContent: false },
});
const memId = owned.data?.[0]?.data?.objectId;
if (!memId) throw new Error("no Memory object owned by sender");
const baseline = await readVault(memId);
console.log(`[0] vault ${memId} — baseline entries: ${baseline.length}`);

// [1] remember: encrypt + Walrus + gasless add_entry
console.log("[1] remember (encrypt → Walrus → add_entry)…");
const remRes = await fetch(`${BASE}/api/memory/remember`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ownerAddress: SENDER, text: FACT, kind: "test", namespace: "lethe" }),
});
if (!remRes.ok) throw new Error(`remember failed: ${remRes.status} ${await remRes.text()}`);
const ref = await remRes.json();
const addTx = new Transaction();
addTx.moveCall({
  target: `${PKG}::memory::add_entry`,
  arguments: [
    addTx.object(memId),
    addTx.pure.string(ref.blobId),
    addTx.pure.string(ref.namespace),
    addTx.pure.string(ref.kind),
    addTx.pure.u64(BigInt(ref.createdAtMs)),
  ],
});
await sponsorExecute(addTx, "add_entry");
await new Promise((r) => setTimeout(r, 1500));
let entries = await readVault(memId);
const addedIdx = entries.findIndex((e) => e.blob_id === ref.blobId);
console.log(`    added blob ${ref.blobId} at index ${addedIdx} (entries=${entries.length})`);
if (addedIdx < 0 || entries.length !== baseline.length + 1) throw new Error("add did not land");

// [2] forget: gasless remove_entry keyed by (index, blob_id)
console.log("[2] gasless memory::remove_entry…");
const rmTx = new Transaction();
rmTx.moveCall({
  target: `${PKG}::memory::remove_entry`,
  arguments: [rmTx.object(memId), rmTx.pure.u64(BigInt(addedIdx)), rmTx.pure.string(ref.blobId)],
});
const rmDigest = await sponsorExecute(rmTx, "remove_entry");
await new Promise((r) => setTimeout(r, 1500));
const tb = await client.getTransactionBlock({ digest: rmDigest, options: { showEffects: true, showEvents: true } });
const forgot = (tb.events ?? []).find((e) => String(e.type).endsWith("::memory::MemoryForgotten"));
console.log(`    status=${tb.effects?.status?.status} digest=${rmDigest}`);
console.log(`    MemoryForgotten event: ${forgot ? "emitted ✓" : "MISSING"}`);

// [3] recall must exclude the forgotten fact
console.log("[3] recall excludes the forgotten fact…");
entries = await readVault(memId);
const refs = entries.map((f) => ({
  blobId: f.blob_id, namespace: f.namespace, kind: f.kind, createdAtMs: Number(f.created_at_ms),
}));
const recRes = await fetch(`${BASE}/api/memory/recall`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ownerAddress: SENDER, query: "", refs, limit: 50 }),
});
if (!recRes.ok) throw new Error(`recall failed: ${recRes.status}`);
const { hits } = await recRes.json();
const stillThere = hits.some((h) => h.text === FACT || h.blobId === ref.blobId);
console.log(`    recall hits=${hits.length}, forgotten fact present: ${stillThere ? "YES (FAIL)" : "NO ✓"}`);

// [4] on-chain length is back to baseline (-1 from post-add)
const finalLen = entries.length;
console.log(`[4] on-chain entries: ${finalLen} (baseline ${baseline.length})`);

const pass =
  tb.effects?.status?.status === "success" &&
  Boolean(forgot) &&
  !stillThere &&
  finalLen === baseline.length &&
  !entries.some((e) => e.blob_id === ref.blobId);
if (!pass) {
  console.error("FORGET E2E GATE FAILED");
  process.exit(1);
}
console.log("\n=== FORGET E2E GATE PASSED ===");
console.log("suiscan tx:", `https://suiscan.xyz/testnet/tx/${rmDigest}`);

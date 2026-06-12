// Phase 3 gate: the REAL hero round-trip, no mock —
// chat (streamed) → extraction → encrypt+Walrus store → gasless add_entry →
// aggregator GET resolves + entry present on-chain.
// Uses the funded deployer key as the "user" signer (same stand-in as
// gasless-e2e.mjs; zkLogin differs only in signature scheme).
// Run from apps/web with the dev server up: node scripts/hero-e2e.mjs
import { readFileSync } from "node:fs";
import { Transaction } from "@mysten/sui/transactions";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { toBase64, fromBase64 } from "@mysten/sui/utils";

// Latest package version (call target) vs original defining package (type filter).
const PKG = "0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c";
const TYPE_PKG = "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";
const BASE = "http://localhost:3010";
const AGG = "https://aggregator.walrus-testnet.walrus.space";

const msEnv = readFileSync(new URL("../../memory-service/.env", import.meta.url), "utf8");
const SK = msEnv.match(/^DEPLOYER_PRIVATE_KEY=(.+)$/m)?.[1]?.trim();
const kp = Ed25519Keypair.fromSecretKey(SK);
const SENDER = kp.getPublicKey().toSuiAddress();
const client = new SuiJsonRpcClient({ network: "testnet", url: getJsonRpcFullnodeUrl("testnet") });

const USER_MSG = "Heads up: I run a strict 5% position-size cap per trade, always.";

// [1] streamed chat reply
console.log("[1] /api/chat (streaming)…");
const chatRes = await fetch(`${BASE}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages: [{ role: "user", content: USER_MSG }], context: [] }),
});
if (!chatRes.ok) throw new Error(`chat failed: ${chatRes.status}`);
let reply = "";
let chunks = 0;
const reader = chatRes.body.getReader();
const dec = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  reply += dec.decode(value, { stream: true });
  chunks++;
}
console.log(`    provider=${chatRes.headers.get("x-provider")} chunks=${chunks} replyLen=${reply.length}`);
if (chunks < 2) console.log("    WARN: reply arrived in <2 chunks — not visibly streamed");

// [2] extraction
console.log("[2] /api/chat/extract…");
const exRes = await fetch(`${BASE}/api/chat/extract`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user: USER_MSG, reply, context: [] }),
});
if (!exRes.ok) throw new Error(`extract failed: ${exRes.status}`);
const { facts } = await exRes.json();
console.log("    facts:", JSON.stringify(facts));
if (!facts?.length) throw new Error("no fact extracted — gate fails");
const fact = facts[0];

// [3] encrypt + Walrus store
console.log("[3] /api/memory/remember (encrypt → Walrus)…");
const remRes = await fetch(`${BASE}/api/memory/remember`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ownerAddress: SENDER, text: fact.text, kind: fact.kind, namespace: "lethe" }),
});
if (!remRes.ok) throw new Error(`remember failed: ${remRes.status} ${await remRes.text()}`);
const ref = await remRes.json();
console.log("    blobId:", ref.blobId);

// [4] gasless add_entry on the existing Memory object
console.log("[4] gasless memory::add_entry…");
const owned = await client.getOwnedObjects({
  owner: SENDER,
  filter: { StructType: `${TYPE_PKG}::memory::Memory` },
  options: { showContent: false },
});
const memId = owned.data?.[0]?.data?.objectId;
if (!memId) throw new Error("no Memory object owned by sender");
const tx = new Transaction();
tx.moveCall({
  target: `${PKG}::memory::add_entry`,
  arguments: [
    tx.object(memId),
    tx.pure.string(ref.blobId),
    tx.pure.string(ref.namespace),
    tx.pure.string(ref.kind),
    tx.pure.u64(BigInt(ref.createdAtMs)),
  ],
});
tx.setSender(SENDER);
const kind = await tx.build({ client, onlyTransactionKind: true });
const cr = await fetch(`${BASE}/api/sponsor`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "create", sender: SENDER, transactionKindBytes: toBase64(kind) }),
});
if (!cr.ok) throw new Error(`sponsor create failed: ${cr.status} ${await cr.text()}`);
const { bytes, digest } = await cr.json();
const { signature } = await kp.signTransaction(fromBase64(bytes));
const er = await fetch(`${BASE}/api/sponsor`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "execute", digest, signature }),
});
if (!er.ok) throw new Error(`sponsor execute failed: ${er.status} ${await er.text()}`);
const { digest: finalDigest } = await er.json();
await new Promise((r) => setTimeout(r, 1800));
const tb = await client.getTransactionBlock({
  digest: finalDigest,
  options: { showEffects: true, showInput: true },
});
const gasOwner = tb.transaction?.data?.gasData?.owner;
console.log(
  `    status=${tb.effects?.status?.status} digest=${finalDigest} gasless=${gasOwner !== SENDER ? "YES" : "NO"}`,
);

// [5] verify links resolve
console.log("[5] verifying links…");
const aggUrl = `${AGG}/v1/blobs/${ref.blobId}`;
const aggRes = await fetch(aggUrl);
const aggBytes = (await aggRes.arrayBuffer()).byteLength;
console.log(`    aggregator GET → ${aggRes.status} (${aggBytes} bytes ciphertext)`);
const obj = await client.getObject({ id: memId, options: { showContent: true } });
const entries = obj.data?.content?.fields?.entries ?? [];
const found = entries.some((e) => (e.fields ?? e).blob_id === ref.blobId);
console.log(`    on-chain entry present: ${found ? "YES" : "NO"} (entries=${entries.length})`);

if (aggRes.status !== 200 || !found || tb.effects?.status?.status !== "success") {
  console.error("GATE FAILED");
  process.exit(1);
}
console.log("\n=== HERO E2E GATE PASSED ===");
console.log("fact:        ", `${fact.text} (${fact.kind})`);
console.log("blobId:      ", ref.blobId);
console.log("aggregator:  ", aggUrl);
console.log("suiscan obj: ", `https://suiscan.xyz/testnet/object/${memId}`);
console.log("suiscan tx:  ", `https://suiscan.xyz/testnet/tx/${finalDigest}`);

// [6] SESSION B — fresh "app instance": on-chain refs → recall → personalized
// greeting must reference the fact written in session A (cross-session memory).
console.log("\n[6] session B: fresh recall → greet…");
const objB = await client.getObject({ id: memId, options: { showContent: true } });
const refsB = (objB.data?.content?.fields?.entries ?? []).map((e) => {
  const f = e.fields ?? e;
  return { blobId: f.blob_id, namespace: f.namespace, kind: f.kind, createdAtMs: Number(f.created_at_ms) };
});
const recB = await fetch(`${BASE}/api/memory/recall`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ownerAddress: SENDER, query: "", refs: refsB, limit: 12 }),
});
if (!recB.ok) throw new Error(`session-B recall failed: ${recB.status} ${await recB.text()}`);
const { hits: hitsB } = await recB.json();
const digestB = hitsB
  .slice()
  .sort((a, b) => b.createdAtMs - a.createdAtMs)
  .map((h) => h.text.slice(0, 160));
console.log(`    recalled ${digestB.length} memories (newest: "${digestB[0]}")`);

const greetRes = await fetch(`${BASE}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ greet: true, context: digestB }),
});
if (!greetRes.ok) throw new Error(`greet failed: ${greetRes.status} ${await greetRes.text()}`);
let greeting = "";
const gReader = greetRes.body.getReader();
while (true) {
  const { done, value } = await gReader.read();
  if (done) break;
  greeting += dec.decode(value, { stream: true });
}
console.log(`    greeting (${greetRes.headers.get("x-provider")}): ${greeting.trim()}`);

// The session-A fact is about a strict 5% position-size cap — the greeting
// must reference it (any of these tokens counts as a reference).
const referenced = /5\s*%|position[- ]?siz|cap/i.test(greeting);
console.log(`    references session-A fact: ${referenced ? "YES" : "NO"}`);
if (!referenced) {
  console.error("SESSION-B GATE FAILED — greeting did not reference the stored fact");
  process.exit(1);
}
console.log("\n=== CROSS-SESSION GATE PASSED — second session knew the user ===");

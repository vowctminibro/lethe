// Full gasless write path: sponsor -> sign -> execute, for memory::create then
// memory::add_entry. Uses the funded deployer key as a stand-in "user" signer
// (Enoki executes any valid user signature; zkLogin differs only in scheme).
// Run from apps/web: node scripts/gasless-e2e.mjs
import { readFileSync } from "node:fs";
import { Transaction } from "@mysten/sui/transactions";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { toBase64, fromBase64 } from "@mysten/sui/utils";

// Latest package version (call target) vs original defining package (type filter).
const PKG = "0x06b5c99940b5de954b2b37cd1198f421921986eabd57b35fe3fd4cc39169ba95";
const TYPE_PKG = "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";
const BASE = "http://localhost:3010";

// deployer key lives in apps/memory-service/.env
const msEnv = readFileSync(new URL("../../memory-service/.env", import.meta.url), "utf8");
const SK = msEnv.match(/^DEPLOYER_PRIVATE_KEY=(.+)$/m)?.[1]?.trim();
const kp = Ed25519Keypair.fromSecretKey(SK);
const SENDER = kp.getPublicKey().toSuiAddress();
const client = new SuiJsonRpcClient({ network: "testnet", url: getJsonRpcFullnodeUrl("testnet") });
console.log("signer:", SENDER);

async function sponsorExecute(tx, label) {
  tx.setSender(SENDER);
  const kind = await tx.build({ client, onlyTransactionKind: true });
  const cr = await fetch(`${BASE}/api/sponsor`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", sender: SENDER, transactionKindBytes: toBase64(kind) }),
  });
  if (!cr.ok) throw new Error(`${label} sponsor create failed: ${cr.status} ${await cr.text()}`);
  const { bytes, digest } = await cr.json();
  const { signature } = await kp.signTransaction(fromBase64(bytes));
  const er = await fetch(`${BASE}/api/sponsor`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "execute", digest, signature }),
  });
  if (!er.ok) throw new Error(`${label} sponsor execute failed: ${er.status} ${await er.text()}`);
  const { digest: finalDigest } = await er.json();
  // resolve effects
  await new Promise((r) => setTimeout(r, 1500));
  const tb = await client.getTransactionBlock({ digest: finalDigest, options: { showObjectChanges: true, showInput: true, showEffects: true } });
  return { finalDigest, tb };
}

// 1. gasless create
console.log("\n[1] gasless memory::create …");
const createTx = new Transaction();
createTx.moveCall({ target: `${PKG}::memory::create` });
const c = await sponsorExecute(createTx, "create");
const created = (c.tb.objectChanges || []).find((o) => o.type === "created" && String(o.objectType || "").endsWith("::memory::Memory"));
const memId = created?.objectId;
const gasOwner = c.tb.transaction?.data?.gasData?.owner;
console.log("   status:", c.tb.effects?.status?.status, "| Memory:", memId, "| gas sponsor:", gasOwner, "| gasless:", gasOwner !== SENDER ? "YES ✓" : "NO");

// 2. gasless add_entry referencing a real Walrus blob
console.log("\n[2] gasless memory::add_entry …");
const BLOB = "cJhbgVkLcihqc7SUN-Zb6e8VwuqzLOazoebINWSpBHU"; // an encrypted blob stored earlier
const addTx = new Transaction();
addTx.moveCall({
  target: `${PKG}::memory::add_entry`,
  arguments: [addTx.object(memId), addTx.pure.string(BLOB), addTx.pure.string("lethe"), addTx.pure.string("trading-style"), addTx.pure.u64(BigInt(Date.now()))],
});
const a = await sponsorExecute(addTx, "add_entry");
const ev = (a.tb.events || []).find((e) => String(e.type || "").endsWith("::memory::EntryAdded"));
console.log("   status:", a.tb.effects?.status?.status, "| EntryAdded:", ev ? "emitted ✓" : "none");

// 3. read object back
const obj = await client.getObject({ id: memId, options: { showContent: true } });
const f = obj.data?.content?.fields;
console.log("\n[3] Memory object on-chain:");
console.log("   owner:", f?.owner);
console.log("   entries:", JSON.stringify(f?.entries));
console.log("\nMEMORY_ID=" + memId);

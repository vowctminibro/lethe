// On-chain integration test for the connect-agent grant/revoke loop.
//
// Signs grant/revoke as the LOCAL sui CLI wallet (active-address; key stays in
// the keystore — never read/printed/committed here) against a REAL testnet vault,
// then hits the live /api/grant/recall broker endpoint to prove the gate:
//
//   baseline authorized → grant(agent) → authorized has agent → /api/grant/recall 200
//   → revoke(agent) → authorized lost agent → /api/grant/recall 403 (blind)
//
// grant then revoke returns the vault to its baseline (net state change = 0).
// Does NOT touch/republish the Move package or Seal — only CALLS the deployed
// memory::grant / memory::revoke and queries chain state.
//
// Run from apps/web:  node scripts/onchain-grant-revoke-e2e.mjs
import { execFileSync } from "node:child_process";

const PKG = process.env.MEMORY_PKG || "0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c"; // v3
const ORIGINAL = "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331"; // type-defining
const FULLNODE = "https://fullnode.testnet.sui.io:443";
const BASE = process.env.LETHE_BASE_URL || "https://lethe-gold.vercel.app";
// "agnt" — normalized to a full 32-byte / 64-hex address (the CLI needs exact width).
const AGENT = "0x" + (process.env.AGENT_ADDR || "61676e74").replace(/^0x/, "").padStart(64, "0");
const GAS = "20000000";
const obj = (id) => `https://suiscan.xyz/testnet/object/${id}`;
const tx = (d) => `https://suiscan.xyz/testnet/tx/${d}`;

const sui = (args) => execFileSync("sui", args, { encoding: "utf8", maxBuffer: 1 << 24 });
const rpc = async (method, params) => {
  const r = await fetch(FULLNODE, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return (await r.json()).result;
};
async function vaultState(id) {
  const r = await rpc("sui_getObject", [id, { showContent: true }]);
  const f = r?.data?.content?.fields;
  return { authorized: f?.authorized ?? [], entries: Array.isArray(f?.entries) ? f.entries.length : 0 };
}
async function recall(owner, app) {
  const r = await fetch(`${BASE}/api/grant/recall`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ ownerAddress: owner, appAddress: app }),
  });
  const body = await r.json().catch(() => ({}));
  return { status: r.status, entries: body.entries?.length ?? 0 };
}
function call(fn, vault) {
  const out = sui(["client", "call", "--package", PKG, "--module", "memory", "--function", fn,
    "--args", vault, AGENT, "--gas-budget", GAS, "--json"]);
  const j = JSON.parse(out);
  return { digest: j.digest, status: j.effects?.status?.status };
}

const OWNER = sui(["client", "active-address"]).trim();
let pass = true;
const log = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"} — ${msg}`); if (!ok) pass = false; };
console.log(`owner (local CLI wallet): ${OWNER}`);
console.log(`agent under test:         ${AGENT}`);
console.log(`broker:                   ${BASE}/api/grant/recall\n`);

// pick a vault: env VAULT, else the owner's first vault that has entries (best proof), else first
let vault = process.env.VAULT;
if (!vault) {
  const owned = await rpc("suix_getOwnedObjects", [OWNER,
    { filter: { StructType: `${ORIGINAL}::memory::Memory` }, options: { showContent: true } }, null, 50]);
  const list = (owned?.data ?? []).map((o) => o.data);
  const withEntries = list.find((o) => (o?.content?.fields?.entries?.length ?? 0) > 0);
  vault = (withEntries ?? list[0])?.objectId;
}
if (!vault) { console.error("no vault found for owner"); process.exit(1); }
console.log(`vault: ${vault}\n  ${obj(vault)}\n`);

// cleanup: if agent already authorized (leftover), revoke first so baseline is clean
let s = await vaultState(vault);
if (s.authorized.includes(AGENT)) {
  console.log("(agent already authorized from a prior run — revoking to reset baseline)");
  call("revoke", vault);
  s = await vaultState(vault);
}

// ── baseline
const baseline = s;
console.log(`BASELINE authorized (${baseline.authorized.length}): ${JSON.stringify(baseline.authorized)}`);
console.log(`vault entries: ${baseline.entries}\n`);
log(!baseline.authorized.includes(AGENT), "baseline: agent NOT in authorized");

// ── grant
const g = call("grant", vault);
console.log(`\ngrant tx: ${g.status}  ${g.digest}\n  ${tx(g.digest)}`);
const afterGrant = await vaultState(vault);
console.log(`AFTER GRANT authorized (${afterGrant.authorized.length}): ${JSON.stringify(afterGrant.authorized)}`);
log(g.status === "success" && afterGrant.authorized.includes(AGENT), "grant: agent ADDED to on-chain authorized vector");

// ── broker read while granted → 200
const granted = await recall(OWNER, AGENT);
console.log(`\n/api/grant/recall (granted) → HTTP ${granted.status}, ${granted.entries} entries`);
log(granted.status === 200, "broker: reads entries while granted (HTTP 200)");

// ── revoke
const r = call("revoke", vault);
console.log(`\nrevoke tx: ${r.status}  ${r.digest}\n  ${tx(r.digest)}`);
const afterRevoke = await vaultState(vault);
console.log(`AFTER REVOKE authorized (${afterRevoke.authorized.length}): ${JSON.stringify(afterRevoke.authorized)}`);
log(r.status === "success" && !afterRevoke.authorized.includes(AGENT), "revoke: agent REMOVED from on-chain authorized vector");
log(JSON.stringify(afterRevoke.authorized) === JSON.stringify(baseline.authorized), "vault returned to baseline (net state change = 0)");

// ── broker read while revoked → 403
const blind = await recall(OWNER, AGENT);
console.log(`\n/api/grant/recall (revoked) → HTTP ${blind.status}`);
log(blind.status === 403, "broker: blind after revoke (HTTP 403)");

console.log(`\n${pass ? "✅ ON-CHAIN E2E PASSED" : "❌ ON-CHAIN E2E FAILED"}`);
process.exit(pass ? 0 : 1);

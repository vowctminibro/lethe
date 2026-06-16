// Seed a demo Memory vault with legacy-AES entries the grant-broker CAN decrypt,
// then PROVE it by hitting the live prod broker (/api/grant/recall) and printing
// the decrypted text. This is the "live-text" payoff for the connect-agent demo.
//
// Why AES (not Seal): the prod broker decrypts legacy AES blobs server-side
// (apps/web/src/lib/memory/grant-read.ts) but returns Seal blobs blind. So a
// vault seeded with AES entries — encrypted under the SAME MEMORY_ENCRYPTION_SECRET
// the prod broker uses — lets a granted agent read real text live.
//
// SECRET HANDLING: reads MEMORY_ENCRYPTION_SECRET from apps/web/.env.local (LOCAL
// secret). Never prints it, never writes it anywhere. If the local secret does NOT
// match prod's, the seeded blobs fail auth-tag check in the broker and are silently
// dropped (they vanish from the result) — that is our match/no-match signal.
//
// Run from apps/web:  node scripts/seed-demo-vault.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { hkdfSync, randomBytes, createCipheriv } from "node:crypto";

// ── env (.env.local) — names only loaded, values stay in memory ──────────────
function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}
const env = loadEnv(new URL("../.env.local", import.meta.url).pathname);

const SECRET = env.MEMORY_ENCRYPTION_SECRET;
const PUBLISHER = env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL;
const AGGREGATOR = env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL;
const PKG = process.env.MEMORY_PKG || env.NEXT_PUBLIC_MEMORY_PACKAGE_ID || "0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c";
const ORIGINAL = env.NEXT_PUBLIC_MEMORY_PACKAGE_ORIGINAL || "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";
const FULLNODE = "https://fullnode.testnet.sui.io:443";
const BASE = process.env.LETHE_BASE_URL || "https://lethe-gold.vercel.app";
const AGENT = "0x" + (process.env.AGENT_ADDR || "61676e74").replace(/^0x/, "").padStart(64, "0");
const GAS = "20000000";
const NS = "demo"; // marks seeded entries so reruns don't pile up

if (!SECRET) { console.error("Missing MEMORY_ENCRYPTION_SECRET in .env.local"); process.exit(1); }
if (!PUBLISHER) { console.error("Missing NEXT_PUBLIC_WALRUS_PUBLISHER_URL in .env.local"); process.exit(1); }

// ── AES-256-GCM, byte-identical to src/lib/memory/encryptor.ts ───────────────
const VERSION = 0x01, IV_LEN = 12;
function deriveKey(ownerAddress) {
  const salt = Buffer.from(ownerAddress.toLowerCase(), "utf8");
  const info = Buffer.from("lethe-memory-entry-v1", "utf8");
  return Buffer.from(hkdfSync("sha256", Buffer.from(SECRET, "utf8"), salt, info, 32));
}
function encrypt(plaintext, ownerAddress) {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(ownerAddress), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([VERSION]), iv, tag, ct]); // [ver][iv12][tag16][ct]
}

// ── helpers ──────────────────────────────────────────────────────────────────
const sui = (args) => execFileSync("sui", args, { encoding: "utf8", maxBuffer: 1 << 24 });
const rpc = async (method, params) => {
  const r = await fetch(FULLNODE, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return (await r.json()).result;
};
async function walrusStore(bytes) {
  const r = await fetch(`${PUBLISHER}/v1/blobs?epochs=10`, { method: "PUT", body: bytes });
  if (!r.ok) throw new Error(`walrus store ${r.status} ${await r.text().catch(() => "")}`);
  const j = await r.json();
  const blobId = j?.newlyCreated?.blobObject?.blobId ?? j?.alreadyCertified?.blobId;
  if (!blobId) throw new Error(`no blobId: ${JSON.stringify(j).slice(0, 200)}`);
  return blobId;
}
function call(fn, ...args) {
  const out = sui(["client", "call", "--package", PKG, "--module", "memory", "--function", fn,
    "--args", ...args, "--gas-budget", GAS, "--json"]);
  const j = JSON.parse(out);
  return { digest: j.digest, status: j.effects?.status?.status, created: j.objectChanges ?? j.effects?.created ?? [] };
}
async function findVault(owner) {
  const owned = await rpc("suix_getOwnedObjects", [owner,
    { filter: { StructType: `${ORIGINAL}::memory::Memory` }, options: { showContent: true } }, null, 50]);
  return (owned?.data ?? []).map((o) => o.data);
}
function entryNamespaces(objContent) {
  const raw = objContent?.fields?.entries ?? [];
  return raw.map((e) => String((e?.fields ?? e)?.namespace ?? ""));
}

// ── the demo memory (realistic, judge-readable) ──────────────────────────────
const DEMO = [
  "Prefers TypeScript and functional style; dislikes heavy OOP frameworks.",
  "Building on Sui — values on-chain ownership and verifiable access control.",
  "Lives in Asia/Bangkok (UTC+7); schedule demos in the morning, local time.",
  "Long-term goal: a portable memory layer agents can warm-start from.",
];

const OWNER = sui(["client", "active-address"]).trim();
console.log(`owner (CLI wallet): ${OWNER}`);
console.log(`package:            ${PKG}`);
console.log(`broker:             ${BASE}/api/grant/recall`);
console.log(`agent under test:   ${AGENT}\n`);

// 1) find or create the vault
let vaults = await findVault(OWNER);
let vault = vaults[0]?.objectId;
if (!vault) {
  console.log("no vault — creating one (memory::create)…");
  const c = call("create");
  const made = (c.created || []).find((o) => String(o.objectType ?? o.type ?? "").includes("::memory::Memory"));
  vault = made?.objectId ?? made?.reference?.objectId;
  if (!vault) { console.error("could not parse created vault id"); process.exit(1); }
  console.log(`created vault: ${vault}`);
  vaults = await findVault(OWNER);
}
console.log(`vault: ${vault}`);
console.log(`  https://suiscan.xyz/testnet/object/${vault}\n`);

// 2) seed (idempotent: skip if demo entries already present)
const existingNs = entryNamespaces(vaults.find((v) => v.objectId === vault)?.content);
const alreadySeeded = existingNs.filter((n) => n === NS).length;
if (alreadySeeded >= DEMO.length) {
  console.log(`✓ vault already has ${alreadySeeded} '${NS}' entries — skipping seed (rerun-safe)\n`);
} else {
  console.log(`seeding ${DEMO.length} AES demo entries…`);
  for (const text of DEMO) {
    const createdAtMs = Date.now();
    const payload = JSON.stringify({ text, kind: "fact", createdAtMs });
    const blobId = await walrusStore(encrypt(payload, OWNER));
    const res = call("add_entry", vault, blobId, NS, "fact", String(createdAtMs));
    console.log(`  + ${res.status}  blob ${blobId.slice(0, 12)}…  "${text.slice(0, 42)}…"`);
  }
  console.log("");
}

// 3) PROVE via prod broker: grant → recall (read text) → revoke
async function recall() {
  const r = await fetch(`${BASE}/api/grant/recall`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ ownerAddress: OWNER, appAddress: AGENT }),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

// clean baseline: if already authorized, revoke first
const vs0 = (await rpc("sui_getObject", [vault, { showContent: true }]))?.data?.content?.fields;
if ((vs0?.authorized ?? []).includes(AGENT)) { console.log("(agent already authorized — revoking to reset)"); call("revoke", vault, AGENT); }

console.log("grant → agent…");
const g = call("grant", vault, AGENT);
console.log(`  grant tx: ${g.status}  ${g.digest}`);

console.log(`\ncalling PROD broker ${BASE}/api/grant/recall …`);
const got = await recall();
console.log(`  HTTP ${got.status}, ${got.body.entries?.length ?? 0} entries returned\n`);

const entries = got.body.entries ?? [];
const readable = entries.filter((e) => e.sealed === false && e.text && e.text.length > 0);
const sealedBlind = entries.filter((e) => e.sealed === true);
for (const e of entries) {
  const tag = e.sealed ? "SEALED (blind)" : (e.text ? "AES → TEXT" : "AES → empty");
  console.log(`  [${tag}] ${e.text ? `"${e.text.slice(0, 60)}"` : "(no text)"}`);
}

console.log("\nrevoke → agent (restore baseline)…");
const rv = call("revoke", vault, AGENT);
console.log(`  revoke tx: ${rv.status}  ${rv.digest}`);

// ── verdict ──────────────────────────────────────────────────────────────────
console.log("\n────────────────────────────────────────────");
const seededReadable = readable.length > 0;
if (seededReadable) {
  console.log(`✅ LIVE TEXT CONFIRMED — ${readable.length} AES entries decrypted by PROD broker.`);
  console.log(`   → LOCAL MEMORY_ENCRYPTION_SECRET MATCHES PROD. No env pull needed.`);
} else {
  console.log(`❌ NO LIVE TEXT — broker returned ${entries.length} entries, ${sealedBlind.length} sealed, 0 readable AES.`);
  console.log(`   → LOCAL secret likely does NOT match prod (seeded AES blobs were dropped on auth-tag failure).`);
  console.log(`   → STOP. Do NOT pull prod secret. Hand env reconciliation to Hermes.`);
}
console.log("────────────────────────────────────────────");
process.exit(seededReadable ? 0 : 2);

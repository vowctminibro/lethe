// BLOCK 9 Phase 3 gate — the server token bucket trips on a burst, and
// memory routes stay 200 after the cap (memory is NEVER rate-limited).
// Dev server on :3010 (or E2E_BASE). Run from apps/web: node scripts/quota-e2e.mjs
const BASE = process.env.E2E_BASE || "http://localhost:3010";
const ADDR = `0xquota${Date.now()}`; // unique key → fresh bucket

// [1] hammer the chat route with empty-context one-liners until 429.
// Bucket: capacity 20, refill 6/min → must trip within ~22 calls.
console.log("[1] bursting /api/chat until the bucket trips…");
let tripped = -1;
for (let i = 1; i <= 25; i++) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: ADDR,
      messages: [{ role: "user", content: "Reply with the single word: ok" }],
      context: [],
    }),
  });
  if (res.ok) await res.text(); // drain the stream
  if (res.status === 429) {
    const { error } = await res.json();
    console.log(`    429 at call #${i} — "${String(error).slice(0, 70)}…"`);
    tripped = i;
    break;
  }
}
if (tripped < 0) throw new Error("QUOTA GATE FAIL: bucket never tripped in 25 calls");

// [2] memory plane still answers AFTER the cap (never limited).
console.log("[2] memory routes after the cap…");
const OWNER = "0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077";
const checks = [
  ["models (read-only)", await fetch(`${BASE}/api/chat/models`)],
  [
    "memory/store (ciphertext pin)",
    await fetch(`${BASE}/api/memory/store`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ciphertextB64: Buffer.from("quota-gate-blob").toString("base64") }),
    }),
  ],
  [
    "pulse/recall (grant-gated read)",
    await fetch(`${BASE}/api/pulse/recall`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerAddress: OWNER }),
    }),
  ],
];
let ok = true;
for (const [name, res] of checks) {
  // pulse may legitimately be 403 (grant state) — anything but 429 proves uncapped.
  const fine = res.status !== 429 && res.status < 500;
  console.log(`    ${name}: HTTP ${res.status} ${fine ? "✓" : "✗"}`);
  if (!fine) ok = false;
}
if (!ok) throw new Error("QUOTA GATE FAIL: a memory route was capped or errored");
console.log(`\n=== QUOTA GATE PASSED — chat tripped at #${tripped}, memory plane untouched ===`);

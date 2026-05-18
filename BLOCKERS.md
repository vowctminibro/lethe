# Lethe — Blockers

## B1 — Testnet faucet rate-limited (non-blocking for Day 1)
Status: CLOSED
Resolved: Day 2, 2026-05-18

`sui client faucet` now only prints the web UI URL; the direct endpoint
`POST https://faucet.testnet.sui.io/v2/gas` returns **HTTP 429 "Too Many
Requests"** on every attempt (4 POST attempts across ~5 min, with
45s/120s backoffs). This is a per-IP rate limit on the Mac Mini's
address, not a bad request.

Wallet `lethe-dev` (`0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077`)
currently holds **0 SUI**.

Not blocking Day 1 — no contract is published today (first NPC contract
is Day 2). Must be resolved before Day 2 publish.

Resolution options for Vow:
- Use the web faucet: https://faucet.sui.io/?address=0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077
- Or re-run `sui client faucet` later once the IP rate-limit window clears.
- Or use the Sui Discord `#testnet-faucet` channel.

## B2 — MemWal SDK package name not yet confirmed
Status: CLOSED
Resolved: Day 2, 2026-05-18

Package: `@mysten-incubation/memwal`
Install: `npm install @mysten-incubation/memwal @mysten/sui @mysten/seal @mysten/walrus`
Also requires: `ai zod` for withMemWal
File: research/memwal-verified.md

## B3 — lethesdk subdomain not yet delegated
Status: CLOSED
Resolved: Day 2, 2026-05-18 (no longer relevant — pivoted to SDK package
published via npm, not custom subdomain).

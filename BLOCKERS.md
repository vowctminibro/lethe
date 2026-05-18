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
Status: OPEN
Discovered: Day 1, 2026-05-15

https://docs.memwal.ai loads (not 404, no login wall on the landing
page), but the public landing page does not state the npm package name.
It references a "TypeScript SDK" and an SDK Quick Start page
(`/sdk/quick-start`) that needs to be opened directly.

MemWal SDK was **NOT installed** (per Day 1 rule: do not install if the
package name is unconfirmed). memory-service currently has
`@mysten/sui`, `@mysten/walrus`, `@mysten/seal` installed — Walrus + Seal
cover storage and encryption; MemWal is the recall layer to add later.
Action for Vow: open https://docs.memwal.ai/sdk/quick-start (register if
prompted) and confirm the exact `pnpm add` package name. Then add it to
memory-service.

## B3 — lethesdk subdomain not yet delegated
Status: CLOSED
Resolved: Day 2, 2026-05-18 (no longer relevant — pivoted to SDK package
published via npm, not custom subdomain).

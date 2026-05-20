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

## B3 — lethesdk.vercel.app squatted
Status: CLOSED
Resolved: Day 2, 2026-05-18 (no longer relevant — pivoted to SDK package
published via npm, not custom subdomain).

## B7 — Landing page production deploy blocked
Status: OPEN
Severity: Hackathon submission risk (landing page not live at lethesdk.vercel.app)

Vercel CLI is authenticated as `vowctminibro-7069` but `vercel --prod` upload
succeeds but build stays `BLOCKED` indefinitely (2+ min of polling). Likely
causes:
1. Branch protection on `main` requiring PR review (free Vercel tier)
2. Build minutes limit exhausted on account

Workaround: `vercel --prod --skip-domain --yes` from `landing/` directory OR
manual redeploy from Vercel dashboard at:
https://vercel.com/vowctminibro-7069s-projects/lethesdk/deployments

Temporary: old deployment still live at https://lethesdk.vercel.app (stale content).

**Vow action required:** Run the 3 commands in `landing/README.md` when at
the machine.

## B5 — Walrus public publisher has no SLA
Status: OPEN
Severity: Hackathon demo risk

The free public Walrus publisher/aggregator endpoints have no uptime SLA.
If the publisher is rate-limited, returns 5xx, or the aggregator is down,
the Lethe demo breaks. Sui on-chain blob_ids still work but blob content
is inaccessible.

Mitigations:
- Cache aggregator content client-side (planned for v0.2)
- Failover publisher list from awesome-walrus repo
- Consider self-hosted publisher pre-submission for high-stakes demos
- Monitor: GET https://publisher.walrus-testnet.walrus.space/v1/system

## B6 — Blob fetch on recall is N HTTP calls
Status: OPEN (acknowledged, not blocking v0.1)
Severity: Low for demo, high for production

GET /recall makes one Sui RPC call + N parallel Walrus aggregator calls
(one per memory entry). Fine for demo (1-5 memories per player). Will not
scale for players with 100+ memories.

Planned: batch blob fetches via Walrus aggregator's batch endpoint
(or cache layer) — target v0.2.

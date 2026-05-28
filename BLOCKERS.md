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
Status: CLOSED (Day 7 — live via last-good-deploy fallback)

lethesdk.vercel.app is LIVE and serving traffic. Every CI/CD build since the
initial working deploy has failed (5 errors in succession), but Vercel keeps
the last-good-deploy live. The page is ~6 commits behind main, not ideal, but
live and functional. Landing page content verified: "Persistent memory", "Lethe",
"Walrus Track" all present in HTML. No Vow action needed.

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

## B11 — Vercel monorepo deploy stuck (Day 7, deferred)

Status: OPEN (not blocking submission — current live page is sufficient)

lethesdk.vercel.app is LIVE serving last-good-deploy (~6 commits behind main).
Every git-push-based CI/CD build since then errors at build step.
Vercel falls back to the last working deployment, keeping the page live.

Root cause: Vercel build cannot compile from monorepo root with custom
vercel.json pointing to `landing/` subdirectory. 5 errors hit in succession:
  1. app dir not found from repo root
  2. routes-manifest.json missing (wrong outputDirectory)
  3. pnpm ERR_INVALID_THIS on build machine
  4. @tailwindcss/postcss in devDeps not installed
  5. typescript in devDeps not installed

Resolution paths (for when content update is urgent):
  A) Static export: `output: 'export'` in next.config → upload landing/out/ plain
  B) Re-link landing/ as standalone Vercel project (separate from monorepo)
  C) Move landing/ to its own repo

---

# Day 2 — Storytelling pivot blockers (2026-05-28)

> The user's brief named these "B2 (MemWal integration)" + "B3 (Walrus
> wallet funding)" — renumbered B12+ since the old B2/B3 are closed.

## B12 — $WAL testnet funding needed (Hermes/Vow task)
Status: OPEN — blocks any Walrus upload test.

Wallet `lethe-dev` holds **1.96 SUI but 0 WAL**. The walrus CLI (1.48.1) is
installed but has **no config file** — `walrus get-wal` fails with "could not
find a valid Walrus configuration file". Fix: set up the testnet
`~/.config/walrus/client_config.yaml`, then `walrus get-wal` (swaps SUI→WAL
1:1). SUI balance is sufficient to swap. (Did not auto-fetch the config to
avoid guessing URLs.)

## B13 — MemWal SDK integration pending
Status: OPEN (decision + setup).

Package confirmed `@mysten-incubation/memwal` (active, commit 2026-05-28).
Still need: (a) decide MemWal vs Walrus-direct for the memory layer — MemWal
gives encrypted storage + semantic recall but does NOT mint NFTs; Walrus-direct
+ our `story.move` gives the NFT + full control; (b) if MemWal: generate an
Ed25519 delegate key + register a MemWal account, set `MEMWAL_*` env. See
research/audit-v2.md.

## B14 — MiniMax token-plan model access
Status: OPEN — verify before wiring generation.

EP key is valid (HTTP 200) but the token plan rejects `MiniMax-Text-01`
(`2061: token plan not support model`). Confirm which text + image models the
plan allows (EP successfully used `image-01` + `speech-2.8-hd`); top up / adjust
plan if Lethe's needed text model isn't covered. No credit-balance API — check
the platform dashboard.

## B15 — Enoki not provisioned
Status: OPEN — blocks zkLogin.

zkLogin via Enoki (recommended, complexity 3) needs an Enoki API key + a Google
OAuth client ID from the Enoki Portal. Not yet created. Without it, "Sign in with
Google" can't work.

## B11 update — Vercel deploy
The monorepo restructure moved `landing/` → `apps/web/`; root `vercel.json` now
builds `apps/web`. Also fixed the real local-build footgun: the shell's
`NODE_ENV=development` broke `next build` (the "useContext null" error) — the
build script now pins `NODE_ENV=production`. Whether the Vercel queue itself is
healthy is untested this session (no push performed).

## B2 — MemWal SDK package unknown
Status: CLOSED (2026-05-28)

Confirmed by Hermes research:
- Package: `@mysten-incubation/memwal` v0.0.5
- npm:  https://www.npmjs.com/package/@mysten-incubation/memwal
- GitHub: https://github.com/MystenLabs/MemWal
- Install: `pnpm add @mysten-incubation/memwal`
- ⚠ Relayer at https://relayer.memwal.ai is a managed service (SPOF).
  v2 roadmap: self-host relayer.

## B3 — WAL testnet tokens
Status: CLOSED (2026-05-28)

Confirmed by Hermes research:
- Command: `walrus get-wal --context testnet`
- Exchange rate: 0.5 SUI → 0.5 WAL
- Requires SUI testnet balance (currently ~1.96 SUI ✓)
- ⚠ SUI testnet wallet address: `0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077`

## B6 — Enoki not provisioned
Status: OPEN — blocks zkLogin / "Sign in with Google"

Vow needs to:
1. Sign up at https://portal.enoki.mystenlabs.com
2. Create an API key (NEXT_PUBLIC_ENOKI_API_KEY + ENOKI_SECRET_KEY)
3. Create Google OAuth client at https://console.cloud.google.com
   - Authorized redirect URI: `https://api.enoki.mystenlabs.com/v1/auth/callback/google`
   - Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env.local

Without this, "Sign in with Google" CTA on landing page is a dead link.

## B7 — MiniMax credits blocked (API error 2061)
Status: OPEN — blocks AI generation

Checked 2026-05-28:
- API key `sk-cp-QSN6AR...` authenticated (HTTP 200 on /v1/me) ✓
- But all model calls returned: `{"error_code":2061,"status_msg":"token plan not support model"}`
- Models tested and failed: `abab6.5s-chat`, `MiniMax-Text-01`
- Action: Vow must log in to https://platform.minimax.io and top up credits
  or upgrade plan to support these models
- After credits restored: wire `generateChapterText()` + `generateChapterImage()`
  in `src/lib/minimax.ts`

## B8 — MemWalAccount not deployed on testnet
Status: OPEN — MemWal reads/writes will fail without deployed account

Before any MemWal call, Vow needs to:
1. Run `pnpm add @mysten-incubation/memwal` in apps/web
2. Deploy MemWalAccount contract on Sui testnet
3. Set `MEMWAL_ACCOUNT_ID` + `NEXT_PUBLIC_MEMWAL_RELAYER_URL` in .env.local
4. Wire `createMemWalAccount()` in auth flow (Day 3)

## B15 — Enoki provider not wired in Next.js app
Status: OPEN — software blocker, can do today

EnokiProvider needs to wrap the Next.js app tree in a `'use client'` providers component.
After B6 is resolved (Enoki keys in hand), wire:
```
// apps/web/src/components/providers.tsx
<EnokiProvider apiKey={NEXT_PUBLIC_ENOKI_API_KEY}>
  {children}
</EnokiProvider>
```
Then add `import './providers'` to layout.tsx before {children}.

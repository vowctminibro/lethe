# Lethe — Progress Log

## Day 1 — May 15, 2026

### Installed
- [x] Rust — cargo 1.95.0 (already present)
- [x] Sui CLI — sui 1.72.1-homebrew (installed via Homebrew)
- [x] Walrus CLI — walrus 1.48.1 (installed to ~/.local/bin; the docs
      install script 404'd, binary pulled directly from the Mysten GCS
      bucket)
- [x] Git LFS — git-lfs 3.7.1 (installed via Homebrew, `git lfs install` run)

Already present and verified: node v24.14.1, pnpm 10.33.0, Homebrew 5.1.11.

### Testnet wallet
- Alias: lethe-dev
- Address: 0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077
- Network: Sui testnet (active env, RPC https://fullnode.testnet.sui.io:443)
- Faucet status: FAILED — faucet endpoint returns HTTP 429 (rate limited).
  Balance: 0 SUI. See BLOCKERS.md B1.
  (Recovery phrases for both generated addresses are stored only in the
  local Sui keystore at ~/.sui/sui_config/ — never committed.)

### Sui Move package
- contracts/lethe/ created via `sui move new lethe`
- Move.toml: edition 2024, framework auto-resolved by Sui CLI 1.72
  (no explicit Sui dep — per CLI recommendation), `lethe = "0x0"`
- `sui move build` — PASSES clean

### memory-service
- Node.js + TypeScript Express sidecar
- Deps: @mysten/sui, @mysten/walrus, @mysten/seal, express, dotenv
- Dev deps: typescript, @types/node, @types/express, tsx
- tsconfig.json: ES2022 / NodeNext / strict
- localhost:3001 verified: YES — `GET /health` → 200
  `{"status":"ok","service":"lethe-memory"}`
- MemWal SDK NOT installed — package name unconfirmed (BLOCKERS.md B2)

### Next step
- Vow installs Unity Hub manually
- Vow reads OnlyFins source code
- Vow resolves faucet (web UI) + confirms MemWal SDK package name
- Day 2: write first NPC Move contract

### Day 1 summary

Day 1 setup complete. Toolchain is fully in place: cargo 1.95.0,
sui 1.72.1, walrus 1.48.1, git-lfs 3.7.1, node v24.14.1, pnpm 10.33.0.
Project scaffold created under ~/Projects/lethe/ (contracts, memory-service,
game-a, game-b, docs, research) with the hero flow frozen at 90 seconds in
docs/HERO_FLOW.md and the stack documented in docs/ARCHITECTURE.md. The Sui
Move package `lethe` builds clean against the testnet framework. The
Node.js memory-service runs and serves a healthy /health endpoint on
localhost:3001. A testnet wallet `lethe-dev` was generated
(0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077) but
the faucet is rate-limited (HTTP 429) so it holds 0 SUI — non-blocking for
Day 1 since no contract is published today; tracked as BLOCKERS.md B1. The
MemWal SDK was not installed because its npm package name is not stated on
the public docs landing page — tracked as B2. Next: Vow installs Unity Hub
manually and reads the OnlyFins source.

### Day 1 reframe — May 15, 2026 (evening)

Pivoted from consumer NPC product → developer SDK after an honest review:

- Original: "AI NPCs that remember you across 2 games" → niche RWA score.
- Reframed: "Memory SDK for Sui game devs" → ecosystem-wide need + Walrus
  track Pattern D (blessed).
- 2 games scope → 1 reference game (saves ~7 days).
- Target user = Sui game devs (validated TAM via Suiplay + Sui Foundation
  gaming push).
- Day 1 toolchain + scaffold REUSED — only positioning changed.

Docs/scaffold touched by the reframe: HERO_FLOW.md, ARCHITECTURE.md and
README.md rewritten; public SDK API surface defined (`Lethe`, `npc()`,
`remember()`, `recall()`, `forget()`); `sdk/` directory added; `game-a/`
and `game-b/` removed, replaced by a single `demo-game/` reference-game
folder. Toolchain, wallet, Move package and memory-service from Day 1 are
unaffected.

### Day 2 plan — May 16, 2026

- Define SDK public API surface (TypeScript types).
- Write first Move contract: NPC + memory objects.
- Decide hosted vs sidecar service model.
- NO Unity work yet — SDK core first.

## Day 2 — May 18, 2026

### SDK public API surface
- Created `sdk/` as standalone TypeScript package.
- Files: `package.json`, `tsconfig.json`, `src/types.ts`, `src/lethe.ts`,
  `src/npc.ts`, `src/index.ts`
- `LetheConfig`, `MemoryEvent`, `RecallResult` types exported.
- `Lethe` class: `npc(id)` returns `NPC` instance.
- `NPC` class: `remember(playerWallet, event)`, `recall(playerWallet)`,
  `forget(playerWallet)` — all throw on non-2xx.
- Build: `pnpm install && pnpm tsc` — PASSES clean.

### Move contract — NPC shared object
- Deleted boilerplate `lethe.move`.
- Created `contracts/lethe/sources/npc.move` — SHARED NPC object
  (`transfer::share_object`).
- `NPC` struct: key { id, name, memories }
- `MemoryEntry` struct: store, copy, drop { player_address, blob_id,
  timestamp_ms }
- `create_npc(name, ctx)`, `add_memory(npc, blob_id, clock, ctx)`,
  `get_memories_for(npc, player)` — all `public`.
- `sui move build` — PASSES with lint warnings (non-fatal).

### memory-service stub routes
- Added `cors` + `@types/cors` deps.
- In-memory `Map<string, MemoryEvent[]>` keyed `${npcId}:${playerWallet}`.
- `POST /npc/:id/remember` → `{ok: true, blobId: "stub-TIMESTAMP"}`
- `GET /npc/:id/recall/:wallet` → `{events, blobId: "stub", suiObjectId: "stub"}`
- `DELETE /npc/:id/forget/:wallet` → `{ok: true}`
- Server verified on `:3001` — all 3 endpoints curl-tested, PASS.

### Wallet cleanup
- `hopeful-agates` alias renamed to `pensive-avanturine` (no `sui keytool remove`
  command available).
- Active wallet remains `lethe-dev` (0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077).

### Commits
- Commit: `66d2f81` — "Day 2: SDK API surface + Move NPC contract + memory-service stubs"
- Pushed to `origin/main`.

### Day 2 summary

SDK package, Move NPC contract, and memory-service stubs all built and
verified. `sdk/` compiles TypeScript clean. `npc.move` builds with only
lint warnings. memory-service endpoints respond correctly to curl.
Git state pushed. Docs updated.

## Day 4 — May 19, 2026

### Walrus Integration (HTTP publisher/aggregator — no SDK)

**Endpoints:**
- Publisher (PUT): `https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=20`
- Aggregator (GET): `https://aggregator.walrus-testnet.walrus.space/v1/blobs/:id`

**Epoch math:** 20 epochs × ~2 days/epoch = ~40 days coverage through Jun 21 deadline + buffer.

**Smoke test:** PASSED ✅
- Stored `{ test: "lethe-day4", ts: 1779096309108 }`
- BlobId: `PcTZQfuYU1JLJwMwsgXTAhUI4oyvSRD3EzHAG43mnKo`
- SuiObjectId: `0x9496010d34072663ffa6ab1747b8d31775366b25c3f0ed9d3d9d811a21174e0b`
- Round-trip: ✅ content matched

### API changes

**`POST /npc/:id/remember`** — now atomic:
1. Store content in Walrus → blobId
2. If Walrus fails → 502 `{ error: "walrus_publisher_failed", details: ... }`
3. If success → Sui `add_memory` moveCall with real blobId

**`GET /npc/:id/recall/:wallet`** — now enriched:
Returns full blob content embedded from Walrus aggregator (parallel fetch via Promise.allSettled).

### 3 Events stored end-to-end

| # | Event | blobId | txDigest |
|---|-------|--------|----------|
| 1 | "stole 100 gold from the merchant" | `U16MlYB1XaJjFxBwwhG_WnI6lc3L_ONRvN3La8UoBiw` | `FitEVdMr7d5Bqief6L4SSpk4Rny67yU9R6QfZ9CWaQqE` |
| 2 | "killed the village chicken" + metadata | `cDH8g1NFO4OZ-OOct_71ZrvC70IeRIRXcSsft0WZlWo` | `EmR9cAGorCZkt8qTTE282J9w4KopppPtKF2DHvBScRbq` |
| 3 | "SDK e2e test event 1779104135534" | `4rlJ6lleJ1K_AJPh8qcZVSSyvF5MXAhp9Lyxf5k1KjU` | `iVxnPsAuVyeVFVR6F3qNbBaQD4C7GNpPcKUftRLMuLY` |

All 3 verifiable at:
- Suiscan testnet: https://testnet.suiscan.xyz/txblock/{txDigest}
- Walrus aggregator: https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blobId}

### SDK e2e — PASSED ✅

```
Storing event via SDK...
✓ remembered: {"ok":true,"blobId":"4rlJ6lleJ1K_AJPh8qcZVSSyvF5MXAhp9Lyxf5k1KjU","txDigest":"iVxnPsAuVyeVFVR6F3qNbBaQD4C7GNpPcKUftRLMuLY","walrusObjectId":"0x842edd79..."}

Recalling memories...
✓ recalled: 4 events
Latest: { blobId: "4rlJ6...", content: { v:1, npcId:"khun-tum", event:"SDK e2e test event 1779104135534", ... } }
✅ SDK e2e PASSED — hero flow verified end-to-end
```

### Files created/modified

| File | Change |
|------|--------|
| `memory-service/src/walrus.ts` | New — storeBlob() + fetchBlob() |
| `memory-service/src/server.ts` | Refactored to use real Walrus blobs |
| `memory-service/scripts/walrus-smoke.ts` | New — smoke test |
| `sdk/scripts/e2e.ts` | New — SDK e2e test |
| `sdk/package.json` | Added tsx dev dep |
| `memory-service/.env` | Added WALRUS_PUBLISHER, AGGREGATOR, EPOCHS |

### Day 4 summary

Hero flow is now **fully functional end-to-end**:
1. Dev calls `npc.remember(wallet, { event })` → SDK POSTs to memory-service
2. Memory-service stores content in **Walrus** (blob_id returned)
3. Memory-service records blob_id on **Sui** via Move `add_memory`
4. Dev calls `npc.recall(wallet)` → SDK GETs from memory-service
5. Memory-service reads NPC memories from Sui, fetches blob content from Walrus
6. Full blob content returned — not just blob_ids

Total commits: 7. All major blockers closed (B1, B2, B3). B5 (Walrus no SLA) and B6 (N+1 recall) documented. Deferred to v0.2.

## Day 7 — May 20, 2026

### Landing page (Next.js 15 + Tailwind 4)

**Stack:** Next.js 16.2.6 (Turbopack) + Tailwind CSS v4 (CSS-first config, no tailwind.config.ts) + pnpm monorepo

**Pages:** `/` — Hero + How it works + Stack diagram + Quickstart code + Footer

**Sections built:**
- `Nav`: Logo λ, "Sui Overflow 2026" badge, GitHub + Quickstart links
- `Hero`: Pulse dot, headline, 2-line sub, install command block, CTA buttons
- `HowItWorks`: 3-column cards (Install / Wire / Ship)
- `Architecture`: Monospace stack diagram (game → SDK → memory-service → Walrus → Sui Move)
- `CodeExample`: Syntax-highlighted quickstart snippet with 3 API calls
- `Footer`: "Built for Sui Overflow 2026 · Walrus Track", GitHub + X links

**File:** `landing/app/page.tsx` (single file, 7KB, no client components)

### Tailwind v4 quirks encountered

1. **No `tailwind.config.ts`** — v4 uses `@theme {}` in CSS. Old v3 syntax (`tailwind.config.ts` with `Config` type) causes TypeScript errors.
2. **No `content` array in CSS config** — v4 scans by default; explicit content paths optional.
3. **`bg-accent`** etc. work via CSS custom properties — no `extend.colors` needed.
4. **`font-mono` in Tailwind** — requires `--font-mono` in `@theme {}` (set).

### Build size

- `.next/build/` total: **68.6 MB** (mostly Turbopack chunks)
- Local preview: **HTTP 200**, "Persistent memory" confirmed in DOM
- Local build: ✅ Compiled successfully, 0 TypeScript errors

### Deploy attempt — Vercel CLI

**Status: DEPLOY BLOCKED**

- `vercel whoami`: ✅ `vowctminibro-7069` (CLI is authenticated)
- Upload: ✅ 8.9KB committed to Vercel, project `lethesdk` linked
- Build: ❌ `readyState: BLOCKED` — build never started, stays BLOCKED after 2+ min polling
- Cause: likely branch protection requiring PR review before production deploy (free tier), or build minutes limit

**Workaround applied:** Pushed to `origin/main` — Vercel auto-deploys on git push. Old deployment (`lethesdk-1wyg12nw1...`) still live at `https://lethesdk.vercel.app` with stale content.

**For Vow:** When you're at the machine, run the 3 commands in `landing/README.md`:
```bash
cd ~/Projects/lethe/landing
vercel --prod --yes
vercel alias set https://<new-url> lethesdk.vercel.app
```

### Commits

- `f7fcffd` — "Day 7: landing page (Next.js 15 + Tailwind) — lethesdk.vercel.app"
- `8b61888` — "cleanup: remove unused tailwind v3 config and boilerplate SVGs"
- Pushed to `origin/main` ✅

### Content copy notes for Vow

1. **Pattern D badge** — removed. "Pattern D" not found in any OnlyFins/Sui Overflow
   research doc. Changed to "Walrus Track · Live on Sui testnet". Commit `0c71862`.
2. **`pnpm add @lethe/sdk`** — package not published yet; placeholder until SDK npm goes live.
3. **memory-service in stack diagram** — dev should self-host sidecar today; hosted version in v0.2.
4. **MemWal .env template** — `memory-service/.env.example` scaffolded for Day 8 setup.

### Day 7 close-out (2026-05-20)

**Shipped:**
- Next.js 15 + Tailwind landing scaffolded (6 sections)
- lethesdk.vercel.app: HTTP 200, "Persistent memory", "Lethe", "Walrus Track" all confirmed in live HTML
- Landing page LIVE — Vercel serves last-good-deploy (about 6 commits behind main)
- `.env.example` scaffolded for MemWal Day 8 integration
- All 5 Vercel CI/CD builds failed at different steps; Vercel kept last-good-deploy live

**Build failure chain (for reference):**
1. app dir not found from monorepo root → fix: `cd landing`
2. routes-manifest missing → fix: outputDirectory
3. pnpm ERR_INVALID_THIS → fix: npm
4. @tailwindcss/postcss devDep missing → fix: move to deps
5. typescript devDep missing → fix: `--include=dev`

**Deferred:**
- Vercel CI/CD pipeline (see B11 — 3 resolution paths listed)
- Landing page content updates (git-push not reaching production)
- Demo game polish (camera follow, dialogue box) → Day 8+

**Pattern D:** Removed from codebase. Live page also does NOT have "Pattern D" (last-good-deploy predates the addition).

**Time:** ~3 hours operator total (landing scaffold + Vercel debug saga + close-out)


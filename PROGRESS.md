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

---

## Day 2 (Storytelling pivot) — May 28, 2026

Pivoted direction: from the NPC-memory dev SDK to **Lethe = persistent AI
storytelling on Sui** (Walrus storage + Sui Story NFT + zkLogin). Target stays
the Walrus track, Sui Overflow 2026.

### Repo restructured (monorepo)
- `landing/` → `apps/web/` (kept the deployed Next.js app + its `.vercel` link; renamed package `landing` → `web`).
- `memory-service/` → `apps/memory-service/`.
- Archived the dev-SDK direction into `research/legacy/`: old `sdk/` (`@lethe/sdk` npc API), `demo-game/` (Unity), `contracts/lethe/sources/npc.move` + its test. Nothing deleted — recoverable.
- New `packages/shared` (`@lethe/shared` domain types: WorldTemplate, Story, Chapter, StoryMemory + WORLD_TEMPLATES) and `packages/sdk` (`@lethe/sdk` story-ops surface, stubs for Day 3).
- Workspace config updated: root `package.json` (`apps/*` + `packages/*`), `pnpm-workspace.yaml`, `vercel.json` → `apps/web`, single root lockfile, `.gitignore` paths.

### New Story domain
- `contracts/lethe/sources/story.move` — `Story` NFT (owned) with appended `Chapter`s; each chapter holds `text_blob_id` + `image_blob_id` (Walrus) + `summary`. Events: `StoryCreated`, `ChapterAdded`. `sui move build` PASSES.

### apps/web scaffolded
- Pages: `/` (landing + "Sign in with Google"), `/play` (5-world picker, imports `@lethe/shared`), `/library` (story list placeholder).
- Deps added: `@mysten/sui`, `@mysten/dapp-kit`, `@mysten/enoki` (zkLogin path — NOT deprecated `@mysten/zklogin`), `@mysten/walrus`, `@tanstack/react-query`, `openai`, `zod`, `lucide-react`, `@lethe/shared`.
- **Build verified GREEN** — `pnpm --filter web build` passes (all routes). Fixed a Next 16.2.6 footgun: the Hermes shell exports `NODE_ENV=development`, which broke the production build; build script now pins `NODE_ENV=production`. Added `not-found.tsx` + `global-error.tsx`.

### Research
- Fresh audit appended to `research/audit-v2.md` (MemWal, Walrus+Seal, zkLogin/Enoki, wallet, MiniMax). Complexity (chosen arch): ~6/10.

### Scope (frozen)
- `HERO_FLOW.md` (root) — the single 90-sec demo path. Decision rule: ship only what's visible in the flow AND bulletproof.

### Created NOT committed-pushed
- This is a local commit only (no push) pending Vow review of the new tree.

### Next (Day 3)
- Wire Enoki provider tree (`'use client'` providers.tsx) + Google sign-in.
- memory-service: refactor NPC routes → story routes (create/add-chapter/get) + Walrus upload/read.
- Publish `story.move` to testnet; thread package id into the service.
- MiniMax: confirm allowed text/image models (token-plan), wire chapter text + scene image generation.

---

## Day 2 (2026-05-28) — Build Sprint

### Pivot locked
- Direction: NPC SDK → AI storytelling on Sui
- Target hackathon: Sui Overflow 2026 — Walrus Specialize track
- Hero flow: 90-second demo (landing → world picker → AI chapter → NFT mint)

### Architecture decisions (Day 2 locked)
| Decision | Choice | Rationale |
|---|---|---|
| zkLogin provider | Enoki ($69/mo or free tier) | Sponsored tx = no wallet popup |
| Encryption layer | Skip Seal v1 | Sui NFT ownership = access proof |
| Memory layer | MemWal v0.0.5 | Acknowledge SPOF; v2 self-host |
| Blob storage | Walrus (no Seal) | Cost-effective, Sui-native |
| AI generation | MiniMax (pending credits) | Budget constraint |

### Brand system (locked)
- Monogram: lowercase lambda λ
- Dual-mode palette (light default / dark)
  - Light: ink `#1A3A4A` / mist `#5A8A9E` / coral `#E8B894` / fog `#EFF5F4`
  - Dark: midnight `#0A1628` / parchment `#E8DFD0` / moonlight `#6B9BD1` / candle `#D4A574`
- Typography: Fraunces (display, serif) + Inter (body) + JetBrains Mono (code)
- All 5 brand assets staged: ~/Projects/lethe/brand-assets/

### Repo restructured (Day 2)
```
apps/
  web/                  Next.js 16.2.6 + Tailwind v4
  memory-service/        (existing)
packages/
  sdk/                 stub package
  shared/               stub package
contracts/             Sui Move (Story NFT)
research/              audit-v2.md, memwal-sdk.md
brand-assets/          Lethe brand SVGs
```

### apps/web scaffolded
- Next.js 16.2.6, React 19.2.4, Tailwind CSS v4
- Pages: `/` (landing), `/library` (stub), `/play` (stub)
- Deps: `@mysten/sui` ^2.17.0, `@mysten/enoki` ^1.0.8, `@mysten/walrus` ^1.1.7, `@mysten/dapp-kit` ^1.0.6, `@tanstack/react-query` ^5, `openai`, `zod`, `lucide-react`
- Confirmed NOT installed (intentional): `@mysten-incubation/memwal` — manually added in Step 5
- `src/lib/` stubs created: sui.ts, enoki.ts, walrus.ts, memwal.ts, minimax.ts, memory.ts, story.ts
- `.env.example` created with all required keys documented

### Packages confirmed from research
| Package | Version | Source |
|---|---|---|
| `@mysten/sui` | ^2.17.0 | Already installed |
| `@mysten/enoki` | ^1.0.8 | Already installed |
| `@mysten/walrus` | ^1.1.7 | Already installed |
| `@mysten/dapp-kit` | ^1.0.6 | Already installed |
| `@mysten-incubation/memwal` | ^0.0.5 | research/memwal-sdk.md |
| `openai` | ^6.39.0 | Already installed |
| `zod` | ^4.4.3 | Already installed |
| `lucide-react` | ^1.17.0 | Already installed |

### Blockers closed
- B2: MemWal SDK — confirmed `@mysten-incubation/memwal` v0.0.5 (npm + GitHub)
- B3: WAL faucet — confirmed `walrus get-wal --context testnet` (0.5 SUI → 0.5 WAL)

### Open blockers (Day 3)
| ID | Blocker | Owner |
|---|---|---|
| B6 | Enoki API key + Google OAuth client | Vow |
| B7 | MiniMax credits (error 2061 = plan expired) | Vow |
| B8 | MemWalAccount deployment on testnet | Vow |
| B15 | Enoki provider wiring in Next.js tree | Hermes |

---

## 2026-05-30 — Pivot landed: create → own LIVE, Walrus load-bearing, gasless verified

**Concept (locked):** consumer app **create → own → battle**, AI art collectible,
Walrus track. NOT an SDK. Storytelling layer fully removed.

### create → own — working end-to-end
- Curated trait menu → ONE locked style (`src/lib/traits.ts`) → MiniMax `image-01`
  (`/api/generate`) → image stored on **Walrus** (`/api/store`) → **Sui NFT** mint
  embedding the Walrus blobId on-chain.
- **Walrus proven load-bearing:** independent aggregator fetch returned byte-identical
  image (187,678 B). `/me` renders via `/api/img/<blobId>` proxy (sets correct MIME;
  aggregator serves no Content-Type).
- **Gasless mint VERIFIED end-to-end** on testnet: Enoki keys in place, `/api/sponsor`
  returns a sponsored tx, full sponsor→sign→execute ran with gas paid by the Enoki
  sponsor (`0x0dec…`), not the sender. Browser zkLogin Google redirect is the only step
  still needing a real browser.

### IDs / artifacts
| Thing | Value |
|---|---|
| Artwork package | `0xea40338dececbdaacf834cbbdd54187cc73ff874944f81e9e815f253b813e1f1` |
| Mint target (allowlisted) | `…::artwork::mint` |
| Example Artwork (gasless mint) | `0x9841963e8ad54696ef133ff047768e41d99d65b6556da170d12f048b23db835d` |
| Example Walrus blob | `WKfWG2P-ZnCbUD-dOw5yzH-0L0BTCfMpYicYXuQ2qvc` |
| Battle package | `0x34df9a5a764e7c15cbdbd3782a262066cba0002c40a18d4e00f5b48928e10172` |
| Example Battle object | `0x058620f53212ee70a98fe7d0aa951b1979a036a31f227fe6b7589c3df360ebdb` |

### Demo safe-path
- 3 pre-baked "house" artworks on Walrus + manifest (`src/data/house-artworks.json`,
  metadata only, no images). `/create` has "try a sample (instant)" so a judge reaches
  the OWN step without a live 18–30s gen. blobIds: ember-fox `1ll0Lzltrgnk…`,
  sage-owl `_Zh-Ga5Xnhqx…`, royal-dragon `Lh-2JNCdPoRx…`.

### Battle — foundation only (no UI/leaderboard yet)
- Model: **community head-to-head vote** (see `BATTLE_DESIGN.md`). Move module
  `lethe_battle::battle` (shared `Battle`, `create_battle` + `vote`) published; CLI e2e
  PASS (votes_a=2, votes_b=1). `/api/battle/{create,vote}` stubs build real txs.
- **Next: add `…::battle::vote` to the Enoki allowlist** (see `HERMES_HANDOFF.md`).

### Housekeeping note — stray on-chain test object
- An early CLI mint created Artwork `0xfdf6833bf241b200e59b93d4b0b5fc6d8f1d31cac3890d03b73fdc69c6c524ce`
  with a placeholder `image_blob_id = "smoke_blob_validation"` (not a real Walrus blob).
  Owned by dev wallet `0x4bf2…077`; harmless, left on-chain. If that wallet demos `/me`,
  that one tile won't render — use a freshly minted piece or a fresh zkLogin account.

### Enoki status
- Keys present in `apps/web/.env.local` (public + secret), gitignored, never committed.
- Mint target allowlisted + verified. Battle vote target pending allowlist add.

### What's next
1. Battle UI + flow (pairing, vote button, live tally) on the published module.
2. Leaderboard (rank by votes / rarity).
3. Enoki allowlist: add `::battle::vote` (Hermes portal step).
4. Full browser zkLogin Google sign-in pass (only thing not yet exercised live).

---

## 2026-05-30 (cont.) — Battle UI + leaderboard + on-chain vote dedup

### Move — per-address vote dedup (republished)
- `battle::vote` now enforces one vote per address via `VecSet<address>` (abort
  `EAlreadyVoted = 3`). Republished → **NEW battle package
  `0xd44a778db90f4623e3b652098ab5c127e0741575c4193561f3cad97d3ac069c5`** (old
  `0x34df9a5a…` superseded — do NOT allowlist it).
- CLI dedup smoke: same address votes twice → 2nd aborts (code 3); two different
  addresses → both count; tally 1/1. PASS.

### Pages (built on published modules)
- `/battle`: two artworks side-by-side via the `/api/img/<blobId>` proxy, live
  on-chain tallies + bar, vote buttons, status, "start a battle" picker.
- `/leaderboard`: ranks artworks by wins → votes → rarity, read live from chain
  via `src/lib/indexer.ts` (queries BattleCreated events → battle objects →
  Artwork objects; merges house battles; aggregates on request).
- Shared `SiteHeader` nav (Create · Collection · Battle · Leaderboard) on every
  page → the create→own→battle→leaderboard loop is navigable, no dead ends.

### Seeded demo data (on testnet, never empty)
- 3 house pieces minted as Artwork objects: ember `0x5473c842…`, sage
  `0x0ac6681c…`, royal `0xdbb091b3…`.
- 2 house battles: ember-vs-sage `0x333c3e97…` (2–0), royal-vs-ember
  `0x209db501…` (2–0). Plus the dedup-smoke battle. Manifest:
  `src/data/house-artworks.json` (objectIds + battle ids committed).

### Gasless voting — WIRED, gated on one flag
- `useBattleActions` (vote + createBattle) runs the SAME Enoki sponsor path as
  mint; `/api/sponsor` now allows the vote + create_battle targets.
- Gate: **`NEXT_PUBLIC_BATTLE_VOTE_ALLOWLISTED`** (default `false`). UI shows a
  clean "gasless voting goes live shortly" instead of erroring.
- Smoke: posting a real vote tx to `/api/sponsor` returns an Enoki 400 (target
  not allowlisted) — proves the path is wired, failing ONLY at the gate.
- **To flip ON (no code change):** (1) add
  `0xd44a778db90f4623e3b652098ab5c127e0741575c4193561f3cad97d3ac069c5::battle::vote`
  (and optionally `::battle::create_battle`) to the Enoki sponsorship allowlist
  (see HERMES_HANDOFF.md); (2) set `NEXT_PUBLIC_BATTLE_VOTE_ALLOWLISTED=true` in
  `apps/web/.env.local`; (3) restart. Voting (and battle creation) then run
  gasless exactly like mint.

### Still needs a real browser
- zkLogin Google sign-in redirect (sign-in + per-user gasless vote/create). The
  mechanism is proven; only the browser OAuth round-trip is unexercised.

---

## 2026-05-30 (cont.) — Object ledger correction + Layer-1 pipeline proof

A browser check caught a reporting conflation: an earlier report cited `0x9841…`
as "the gasless-minted artwork" when it actually carries PLACEHOLDER data. Truth,
verified via curl + RPC:

**Object ledger (authoritative — do NOT conflate):**
| Object | image_blob_id | What it is |
|---|---|---|
| `0x9841963e…835d` | `demoblob` / `demo prompt` | ⚠️ Gasless-SPONSORSHIP mechanism test (placeholder). NOT a real artwork. |
| `0xfdf6833b…24ce` | `smoke_blob_validation` | ⚠️ Early CLI mint validation (placeholder). NOT a real artwork. |
| `0xf266936a…d160` | `WKfWG2P-…` (real JPEG 187,678 B) | ✅ Real-pipeline object (CLI smoke), dragon/midnight/crown/blue. |
| `0xd7d5541d…c7b6` | `KPWWxymZ…` (real JPEG 159,448 B) | ✅ Layer-1 real-pipeline proof, owl/gold/crown/cream. |

**Findings:**
- Blob `WKfWG2P-…` **IS a real JPEG** (curl: 187,678 B, `FF D8 FF`). The browser's
  "config dump" was not reproducible; cause was the aggregator sending no
  Content-Type — handled by the `/api/img/<blobId>` proxy. NOT a placeholder.
- `demoblob`/`smoke_blob_validation` exist ONLY on those two past test objects and
  in docs. **Shipping code has zero placeholders** — `mintIt` uploads the real image
  via `/api/store` and mints the returned blobId (`create/page.tsx` → `mint.ts` →
  `sui.ts buildMintArtworkTx` → `tx.pure.string(blobId)`).

**Layer-1 proof (NEW, `0xd7d5541d…c7b6`):** ran the REAL pipeline functions
(generate via `/api/generate` → upload via `/api/store` → mint via the app's
`buildMintArtworkTx`/`sui.ts`), signed with the **dev key**. On-chain
`image_blob_id == KPWWxymZ…` (the freshly-uploaded blob, NOT a placeholder), traits
== owl/gold/crown/cream, prompt matches; `/api/img/<blob>` → 200 image/jpeg.

⮕ This proves the gen→store→mint LOGIC is correct at the code level. It was signed
with the dev key and **did NOT go through browser zkLogin**.

### STILL NOT PROVEN (Vow's manual browser step)
The real app path — **browser Google zkLogin → /create UI → sponsored mint signed
by the zkLogin account** — has NEVER run. Layer 1 is not a substitute for it.

---

## 2026-05-30 (cont.) — Battle lifecycle: close/resolve + REAL wins

### Move — close/resolve (republished)
- `lethe_battle::battle` now has `creator`, `status` (0 open/1 closed), `winner_side`
  (0=A,1=B,2=tie,255=open), `winner_artwork`. New entry fun **`resolve_battle`**
  (creator-only, `ENotCreator=4`); ties close cleanly (winner_side=2, no artwork).
  `vote` still aborts on a closed battle (`EBattleClosed=1`). dedup intact.
- **NEW package id: `0x1e7048dcb7592991e7da775e6516d4755a3ca07f5d71b898ae173d95ddfdc983`**
  (supersedes `0xd44a778d…` and `0x34df9a5a…` — both DEAD, do not allowlist).
- CLI smoke (PASS): create→vote A,B,A→resolve → status=closed, winner=A
  (`0xf78ae7b7…`); post-resolve vote aborts; a 1–1 tie battle resolves to tie
  (`0x2b892ea3…`, winner_side=2).

### Leaderboard — REAL wins (approach)
- `src/lib/indexer.ts`: reads battles via `BattleCreated` events (+ manifest
  fallback) → battle objects → artwork objects. **Wins now count ONLY resolved
  battles (`status==1`) where a side actually won (`winner_side` 0 or 1)**; ties
  and open battles award nothing. Ranking = wins desc, then rarity score (rarity
  is the sole tiebreak). Total votes are still shown but no longer affect rank.
  Aggregation is computed per request (cheap at demo scale); no separate cache.
- Seeded non-empty: resolved house battles give **Royal Dragon 1 win (Legendary,
  #1), Ember Fox 1 win (Rare, #2), Sage Owl 0 (#3)**. Verified via /leaderboard.

### UI — close + winner
- `/battle`: the battle **creator** sees "Close & declare winner" on an open
  battle → `resolve_battle` via the same Enoki sponsor path (gated on
  `NEXT_PUBLIC_BATTLE_VOTE_ALLOWLISTED`; graceful "goes gasless shortly" when off).
  Closed cards show a Closed badge, the winning artwork outlined with "Winner 🏆"
  (loser dimmed), or "Closed · Tie". Vote buttons hidden once closed.
- `/leaderboard` shows the real-wins ranking; winners render via `/api/img`.

### Allowlist regression note (expected)
- Republishing changed the package, so the OLD vote target is stale and the NEW
  `::battle::vote` + `::battle::resolve_battle` are NOT yet allowlisted →
  `NEXT_PUBLIC_BATTLE_VOTE_ALLOWLISTED` set back to **false**. Vote/close degrade
  gracefully meanwhile; seeded battles still show live tallies + winners.
- To re-enable gasless vote AND close: allowlist both targets (HERMES_HANDOFF.md),
  set the flag true, restart. Also set the flag in the Vercel env for deploys.

---

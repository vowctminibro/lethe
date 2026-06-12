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

---

## 2026-05-31 — Overnight autonomous session

### Phase 0 — build PASS
`pnpm install` + `pnpm --filter web build` → GREEN, all 14 routes compile. Code is deploy-ready; no code blocker.

### Phase 1 — Vercel env + deploy
- Env: lethesdk had 0/10 prod vars. Added all 10 from apps/web/.env.local. NOTE: this Vercel CLI (54.x) runs `--non-interactive` for agents, so piped stdin is ignored (stored empty twice); the working method is `vercel env add NAME production --value "<v>" --force --yes` (NEXT_PUBLIC as `--no-sensitive` so they're verifiable; secrets sensitive/write-only). Verified: 10/10 present, NEXT_PUBLIC values correct (SUI_NETWORK=testnet, artwork + battle ids match, VOTE_ALLOWLISTED=true). The 2 secrets read back empty via `env pull` — expected (sensitive).
- Deploy: single `vercel --prod --yes` → still `Error: No Next.js version detected / check Root Directory`. Did NOT retry (rule c). 
- **VERDICT B:** code builds + env correct; blocked ONLY by dashboard Root Directory ≠ apps/web on project `lethesdk`. Fix: Settings → Build & Deployment → Root Directory = `apps/web` → Redeploy. Nothing else blocks it.

### Phase 2-6 (overnight, cont.)
- Wiring audit: full create→own→battle PRESENT, no placeholders, packages live on-chain, no secrets committed (research/wiring-audit.md).
- feat/walrus-deepening (branch, NOT merged): provenance bundle (Walrus manifest + on-chain ;bundle: ref, round-trip proven) + live minted counter (ArtworkMinted events, currently 10). Reviewer/edge-case subagents: no blockers, hardening applied. docs/provenance-bundle-spec.md + docs/walrus-deepening-notes.md.
- Phase 4 main: BRAND.md verbal → collectible; og.png 1200×630; removed stray repo-root brand PNGs.
- Phase 5 deps (report only): stack at latest (Next 16.2.6, @mysten/sui 2.17, dapp-kit 1.0.6, enoki 1.0.8, walrus 1.1.7); only react patch + TS6/@types/node majors (dev) lag. Nothing changed.
- Morning briefing: OVERNIGHT-BRIEFING.md. Deploy verdict B (Vow sets Root Directory=apps/web then redeploy).

---

## 2026-06-10 — MEGA-BLOCK 1, Phase 0 audit

**Toolchain:** node v24.14.1, pnpm 10.33.0, sui 1.72.1 — all green.
Wallet `lethe-dev` (`0x4bf2…8077`) active, **0.94 SUI** (just under the 1-SUI
threshold; CLI faucet now web-UI-only → non-blocking: package already
published and ALL app txs are Enoki-sponsored. Logged, moving on).

**Prior-run coverage (Jun 8–10 commits `861143e`→`548451a`, logged in REAIM.md
not PROGRESS.md — this entry reconciles):**

| Mega-block phase | Status found |
|---|---|
| HERO_FLOW.md | ✅ exists, canon (owned portable memory, 90s flow) |
| 1A Move package | ✅ EQUIVALENT DONE — `memory::memory` published `0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331` (Memory{owner, entries:vector<BlobRef>, authorized:vector<address>}, create/add_entry/grant/revoke + events). Verified on-chain this session: package object readable; smoke Memory objects `0x5dedf577…2054` + `0x6899c9fc…3bf4` readable with real BlobRefs. Naming differs from spec (memory::Memory vs lethe_memory::MemoryVault; authorized addresses vs app_id strings; no on-chain summary — content is ENCRYPTED on Walrus by design). NOT re-publishing. **Gap: no `sui move test` suite** → added this block. |
| 1B store de-risk | ✅ DONE — verdict **FALLBACK** (ManualProvider: AES-256-GCM encrypt → Walrus HTTP publisher → on-chain BlobRef; recall = on-chain refs → aggregator fetch → decrypt → rank). MemWal data plane blocked: npm SDK 0.0.2 < relayer minSupportedSdk 0.0.4 → HTTP 426 (REAIM §3). **Gap: verdict not in BLOCKERS.md** → added this block. |
| 2 sign-in → vault | ⚠️ PARTIAL — landing re-skinned to Lethe positioning; gasless create verified via script; but vault creation is LAZY (first remember), no "vault created" birth moment at sign-in. → built this block. |
| 3 chat + rail | ⚠️ PARTIAL — /chat real LLM (Groq→Gemini→NIM) + RAG + auto-remember + proof chips; /memory verifiable view + grant/revoke UI. **Gaps:** no token streaming, no right-side memory rail, no dev mock, no polish-loop screenshots, e2e not re-verified post-LLM-switch. → built this block. |
| 4 second surface | ❌ NOT DONE — /pulse missing (the portability money shot). |

**Skipping as verifiably done:** Move package publish, MemoryStore impl choice,
landing re-skin, /memory grants UI. Old art routes (/create /me /battle
/leaderboard) remain orphaned-not-deleted (only legacy pages link them). ✓

## 2026-06-10 — MEGA-BLOCK 1, Phase 1A (Move)

Package already published (`0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331`,
verified readable on-chain this session; smoke Memory `0x5dedf577…2054` +
`0x6899c9fc…3bf4` readable with real BlobRefs). Added the missing unit suite
`contracts/memory/tests/memory_tests.move`: owner-only enforcement on
add_entry/grant/revoke (3 expected-failure tests), duplicate-grant +
unknown-revoke aborts, and the full create→add→grant→revoke happy path.
`sui move test`: **6/6 PASS**. No republish — same package stays live.

## 2026-06-10 — MEGA-BLOCK 1, Phase 1B (memory store de-risk)

Store impl chosen in a prior chunk; this phase closed the two gaps the audit
found: (1) verdict now logged as **BLOCKERS.md B16** — **FALLBACK**
(ManualProvider; MemWal data plane 426: npm SDK 0.0.2 < relayer min 0.0.4,
0.0.4 unpublished); (2) round-trip **re-verified live this session**:

- write: `POST /api/memory/remember` → blob `011jbrJ487fHpWQMWbc82N04unj2AO90SKQSMnnD1nU`
- aggregator: `GET …/v1/blobs/011jbrJ…` → HTTP 200, 152 B ciphertext (no plaintext leak)
- recall: `POST /api/memory/recall` → exact plaintext back ("…momentum trader, no leverage")

Interface already matches the spec shape (`remember`/`recall`/`grant`/`revoke`
in `src/lib/memory/provider.ts`). GATE PASSED.

## 2026-06-10 — MEGA-BLOCK 1, Phase 2 (sign-in → vault birth)

Landing already carried Lethe positioning; this phase added the missing **birth
moment**. New `src/lib/memory/gasless.ts` extracts the sponsor→sign→execute
plumbing and adds `ensureVault()` — app-wide per-address dedupe so landing hero,
chat, and strict-mode double effects can never double-mint. `useVaultBirth()`
(`src/lib/memory/vault.ts`) drives the hero: fresh session → gasless
`memory::create` → "Memory vault created on Sui" card with live Suiscan
object + tx links; returning user resolves silently to "Vault live on Sui".
ManualProvider refactored onto the shared module (no behavior change).

**Gate verification (real testnet):** `node scripts/gasless-e2e.mjs` →
fresh vault `0x47374a34a1a0c8cf606f30efa716b8106ad5f3a2677957c8e897282bae527655`,
status success, gas sponsor `0x0dec4c7d…` ≠ signer ⇒ **zero gas paid by user**;
object read back on-chain with a real BlobRef appended.
Suiscan: https://suiscan.xyz/testnet/object/0x47374a34a1a0c8cf606f30efa716b8106ad5f3a2677957c8e897282bae527655
Known seam (unchanged, logged in REAIM): live Google OAuth click-through not
agent-testable; signing path identical to the proven art-mint flow.
`tsc --noEmit` clean, `pnpm build` GREEN. GATE PASSED.

## 2026-06-10 — MEGA-BLOCK 1, Phase 3 (streaming chat + memory rail + dev mock)

**Streaming:** LLM seam grew `stream()` (SSE) on Groq/Gemini/NIM + `streamComplete()`
factory with fall-through; `/api/chat` now streams plain-text tokens (model id in
`x-provider`). Found en route: **GROQ_API_KEY + GEMINI_API_KEY are EMPTY in
.env.local** — chain runs entirely on NVIDIA NIM (llama-3.3-70b). Works fine;
filling the other free keys gives redundancy (note for Vow).

**Extraction:** new `/api/chat/extract` — strict-JSON, 0–2 durable facts per user
turn, deduped against recalled context (verified: restating known facts → 0).

**Memory rail:** right-side rail on /chat seeds from the on-chain vault and
animates each extracted fact in as a chip: pending (pulse) → confirmed with
Walrus blob + Suiscan links. Memory writes are the visible product moment.

**Wallet link:** thin read-only `/api/onchain/snapshot` (balances/objects/
protocols via RPC, no LLM) + "Link a wallet" affordance injecting flavor into chat.

**Dev mock:** `NODE_ENV==='development' && NEXT_PUBLIC_DEMO_MOCK==='1'` →
seeded session (real testnet vault `0x4737…7655` + 5 real blob ids, so links
resolve) without OAuth. NODE_ENV is build-inlined ⇒ impossible in prod.

**Polish loop (3 rounds, screenshots in docs/screenshots/mega1/):** r1 caught a
real bug (unstable account identity → infinite effect loop locking the rail in
skeletons); r2 fixed + mock identity in header; r3/r4 fixed post-reply shimmer
affordance + verified the chip moment with novel facts.

**GATE (real, non-mock) — hero-e2e.mjs PASSED:**
- chat streamed: 69 chunks via nvidia-nim/meta/llama-3.3-70b-instruct
- extracted: "5% position-size cap" (trading-style)
- blob: `TliDaVCGd3BS0HWfitcf-HVyXoTZ_r4Y5jRxpGZyRxs` → aggregator 200 (111 B ciphertext)
- gasless add_entry: `H2Wi7PwDoFFaQeuA3etYokwPwqhkQXtNybTxuprfwB99` (sponsor ≠ signer)
- entry on-chain: vault `0x47374a34a1a0c8cf606f30efa716b8106ad5f3a2677957c8e897282bae527655` (entries=2)
- aggregator URL: https://aggregator.walrus-testnet.walrus.space/v1/blobs/TliDaVCGd3BS0HWfitcf-HVyXoTZ_r4Y5jRxpGZyRxs
- Suiscan: https://suiscan.xyz/testnet/tx/H2Wi7PwDoFFaQeuA3etYokwPwqhkQXtNybTxuprfwB99
`tsc --noEmit` clean · `pnpm build` GREEN (14/14 routes). GATE PASSED.

## 2026-06-10 — MEGA-BLOCK 1, Phase 4 (Pulse — the money shot)

**/pulse shipped** — a visually distinct second surface (midnight palette,
dashboard layout, own wordmark "◍ Pulse — powered by Lethe memory") that reads
the SAME owned vault. Pulse's identity is a well-known app address
(`0x…70756c7365`, "pulse" in hex — `src/lib/pulse.ts`), granted/revoked on the
vault's on-chain `authorized` vector, so access is judge-verifiable on Suiscan.

**Enforcement is server-side**: `/api/pulse/recall` reads the vault from chain
and decrypts ONLY if Pulse's address is authorized — revoked → HTTP 403, zero
entries. Granted → entries + a token-streamed personalized briefing proving it
already knows the user. /memory gained a one-tap Pulse grant/revoke row.
Dev mock moved to sessionStorage so revoke-on-/memory → /pulse-knows-nothing
demos across page loads.

**GATE (real testnet) — pulse-e2e.mjs PASSED:**
- baseline never-granted → 403 "Pulse is not authorized on this vault"
- gasless grant `DWeR7SCSFs4aLP59vhnHxvUqwyCfbhPhNSb63KyS5o4b` → 200, 2 decrypted entries
  ("5% position-size cap", "I am a momentum trader and I hate leverage")
- gasless revoke `9Qudg7kxtNgSigjyK8PV2vN1J9gpCR7eEg7PovtFi6Uv` → 403, zero entries
- vault: https://suiscan.xyz/testnet/object/0x47374a34a1a0c8cf606f30efa716b8106ad5f3a2677957c8e897282bae527655
Screenshots: docs/screenshots/mega1/p2-pulse-{granted,denied}.png + p2-memory-pulse-row.png.
`tsc` clean · `pnpm build` GREEN. GATE PASSED.

=== LETHE MEGA-BLOCK 1 REPORT ===
Phase 0 audit: prior runs (REAIM chunks, Jun 8-10) had already covered: HERO_FLOW.md canon, Move package published (equivalent design memory::memory, NOT re-published), MemoryStore impl chosen (ManualProvider), landing re-skin, /memory grants UI, old art routes orphaned. Skipped all of those. Gaps built this block: Move unit tests (Phase 1A), 1B verdict logging + re-verification, vault birth moment, streaming, memory rail, dev mock, polish loop, /pulse.
Phase 1A Move: package 0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331 (pre-published, verified readable); smoke vaults 0x5dedf577…2054 / 0x6899c9fc…3bf4 + fresh 0x47374a34…7655; sui move test 6/6 PASS (owner-only x3, dup-grant/unknown-revoke aborts, happy path).
Phase 1B store: FALLBACK (ManualProvider: AES-256-GCM(HKDF per owner) → Walrus HTTP → on-chain BlobRef; MemWal data plane 426: npm SDK 0.0.2 < relayer min 0.0.4, unpublished — BLOCKERS.md B16). Round-trip re-verified: blob 011jbrJ487fHpWQMWbc82N04unj2AO90SKQSMnnD1nU → aggregator 200 ciphertext → recall returns exact plaintext.
Phase 2: VERIFIED. Eager gasless vault birth at sign-in (ensureVault, app-wide dedupe) + hero moment with live links. Example vault 0x47374a34a1a0c8cf606f30efa716b8106ad5f3a2677957c8e897282bae527655, gas sponsor 0x0dec4c7d… ≠ signer. https://suiscan.xyz/testnet/object/0x47374a34a1a0c8cf606f30efa716b8106ad5f3a2677957c8e897282bae527655 (Browser OAuth click-through remains the one non-agent-testable seam, signing path identical to proven art mint.)
Phase 3: VERIFIED (hero-e2e.mjs, real non-mock). Streamed 69 chunks → extracted "5% position-size cap" → blob TliDaVCGd3BS0HWfitcf-HVyXoTZ_r4Y5jRxpGZyRxs → gasless add_entry H2Wi7PwDoFFaQeuA3etYokwPwqhkQXtNybTxuprfwB99 → aggregator 200 + entry on-chain. URLs: https://aggregator.walrus-testnet.walrus.space/v1/blobs/TliDaVCGd3BS0HWfitcf-HVyXoTZ_r4Y5jRxpGZyRxs · https://suiscan.xyz/testnet/tx/H2Wi7PwDoFFaQeuA3etYokwPwqhkQXtNybTxuprfwB99. Screenshots: docs/screenshots/mega1/ (home, chat streaming/settled, memory). Polish loop 3 rounds; r1 caught+fixed an infinite-effect-loop bug.
Phase 4: DONE + VERIFIED (pulse-e2e.mjs): 403 never-granted → gasless grant DWeR7SCSFs4aLP59vhnHxvUqwyCfbhPhNSb63KyS5o4b → 200 with 2 decrypted entries → gasless revoke 9Qudg7kxtNgSigjyK8PV2vN1J9gpCR7eEg7PovtFi6Uv → 403 zero entries. Server-side enforcement in /api/pulse/recall.
Commits: eb83050 (1B) · b9d0bcd (2) · ab9c761 (3) · b1bf77e (4) — plus prior-session d7f7781 (0) · c3bc969 (1A). All pushed.
Blockers: B16 MemWal data plane (worked around, FALLBACK shipped). NEW for Vow: GROQ_API_KEY + GEMINI_API_KEY are EMPTY in apps/web/.env.local — whole LLM chain currently rides on NVIDIA NIM alone; fill the two free keys for redundancy. Browser zkLogin OAuth still needs one human click-through pass.
Recommended next block: (1) Vow does ONE live browser pass: Google sign-in → vault birth → chat → /memory → grant Pulse → /pulse → revoke → /pulse (everything underneath is verified; this de-risks the only untested seam). (2) Vercel deploy of the new app (env vars incl. MEMORY_PACKAGE_ID + ENCRYPTION_SECRET; Root Directory fix from B11). (3) Demo video script around the 90s flow + judge-facing README. Optional polish: nav link to Pulse from chat, mobile rail treatment.
=== END REPORT ===

## 2026-06-10 — BLOCK 2, Step 1 (LLM provider chain: MiniMax primary → NIM fallback)

**MiniMax verdict: NOT broken — just never wired in.** The paid key was only
used by the legacy image plane (`lib/minimax.ts`, image_generation). Live test:
chatcompletion_v2 → HTTP 200 in 2.4s, streaming SSE works. Two API quirks
handled in the new provider: `response_format: json_object` unsupported
(error 2013 → JSON via prompt + object-slice when `json: true`), and errors can
arrive as HTTP 200 + `base_resp.status_code != 0` (now thrown).

**Chain rebuilt** (`src/lib/llm/`): MiniMax (paid, primary) → NVIDIA NIM →
Groq → Gemini, for BOTH chat streaming and extraction (both routes go through
the same factory). Per-request failover: each attempt runs under a timeout
(30s default, `LLM_TIMEOUT_MS` override) chained to the caller's signal;
timeout/5xx/429/any setup error logs `[llm] … failing over` and falls through.
Stream timeout covers setup-to-first-byte only — a live stream is never killed.

**GATES:**
- Failover unit tests (`scripts/test-llm-failover.mjs`, mocked fetch, no
  network): 8/8 PASS — incl. "mock a MiniMax failure (500/429/base_resp/hang)
  → NIM serves" for complete() AND streamComplete(), healthy-MiniMax-primary,
  and both-down readable error.
- hero-e2e.mjs re-run through the chain (real, non-mock): PASSED —
  `provider=minimax/MiniMax-Text-01`, fact "Uses a strict 5% position-size cap
  per trade" extracted, blob GbB45iJxmH5F8Si_78GG_macC6WeLS64jXjx7x852Eg →
  aggregator 200, gasless add_entry 7y3b2dprDCtSbYmc4Fxa47MFVAxrLsWknqEjKU4uAc9m
  (entries=3).
`tsc --noEmit` clean · `pnpm build` GREEN.

## 2026-06-10 — BLOCK 2, Step 2 (Brand v2 + metadata + OG image)

**BRAND.md verbal identity → v2** with the locked copy: "Memory you own." /
one-liner / problem / solution / closing lines / Walrus integration note
(MemWal B16 + provider abstraction). On-brand voice examples refreshed from
art-era to memory-era.

**Metadata app-wide** (`app/layout.tsx`, the only metadata export): title
"Lethe — Memory you own", description = the one-liner, OpenGraph + Twitter
card → /og.png, plus `metadataBase` https://lethe-gold.vercel.app so social
crawlers get absolute URLs. Grep confirms **0** "art collectibles" strings in
metadata/landing copy (the stale title lives only on the old deployment —
Step 5's job).

**og.png** generated programmatically (sharp + inline SVG,
`scripts/generate-og.mjs`): Fog bg, Georgia-italic Ink headline "Memory you
own." with Coral ink-stroke under "own", Mist subline, L-mark + wordmark,
oversized ghost-L texture. Viewed at full size, 1 iteration (right-edge coral
dot tied into the ghost-L). **22.8 KB** < 300 KB. GATE PASSED.
`tsc` clean · `pnpm build` GREEN.

## 2026-06-10 — BLOCK 2, Step 3 (Visual pass, 4 surfaces)

Playwright pass (`apps/web/scripts/shoot-screens.mjs`) on :3010 with
NEXT_PUBLIC_DEMO_MOCK=1 — landing, /chat mid-stream (cursor caught mid-token)
+ memory-chip moment ("writing…" pending chip), /memory, /pulse granted AND
revoked, at 1440x900 + 390x844 @2x. Every shot VIEWED. Zero console errors
on both viewports.

**Fix round (4 issues):**
1. Landing hero still carried v1 copy → now brand v2: "Memory you own."
   headline + one-liner subline + river-of-forgetting eyebrow (also puts the
   Step-5 grep phrase in the body, not just <title>).
2. /chat mobile header wrapped "Your Memory →" to two lines → nowrap, tighter
   gap, dev-only DEMO MOCK chip hidden <sm.
3. Next dev-tools floating button polluted every shot → hidden via injected
   CSS in the shoot script (dev-only chrome, not product).
4. /pulse fullPage shots exaggerated below-fold void → viewport shots.

Re-shot after fixes. Final set: `design/screens/*.png` (12 shots; round-1
archive in `design/screens/r1/`). GATE: each screen reads shippable —
chip moment shows `via minimax/MiniMax-Text-01` (Step 1 visible in product).
`tsc` clean · `pnpm build` GREEN.

## 2026-06-10 — BLOCK 2, Step 4 (Vercel env sync)

Vercel link: repo root `.vercel/project.json` (project "lethe"). Diffed
`process.env.*` / `NEXT_PUBLIC_*` across apps/web vs `npx vercel env ls`.

**Missing required names added to production + preview + development (3):**
MEMORY_ENCRYPTION_SECRET · NEXT_PUBLIC_MEMORY_PACKAGE_ID ·
NEXT_PUBLIC_MEMORY_ALLOWLISTED (values from .env.local, never printed).
Prod/dev via `printf | vercel env add`; preview via Vercel REST API
(POST /v10/projects/:id/env) because the CLI's non-interactive preview add
loops on `git_branch_required` even with `--yes` — documented workaround.

**Intentionally NOT added** (referenced in code but optional with safe
defaults, unset/empty in the locally-verified config — placeholders would
CHANGE behavior, e.g. a non-empty GROQ_API_KEY makes the chain try Groq):
GEMINI_API_KEY, GROQ_API_KEY (empty locally), NEXT_PUBLIC_MEMORY_PROVIDER
(defaults "manual" = verified FALLBACK), LLM_TIMEOUT_MS (default 30s),
MINIMAX_MODEL, NVIDIA_NIM_MODEL (model defaults), NEXT_PUBLIC_DEMO_MOCK
(dev-only dead code in prod builds), NODE_ENV (platform-managed).

GATE: zero missing required names — verified via `vercel env ls`.

## 2026-06-10 — BLOCK 2, Step 5 (Deploy + external verify — Build ≠ Ship)

`npx vercel --prod` from the linked repo root. Two transient Vercel API 500s
on /v2/files (44.7MB upload) → added `.vercelignore` (docs/design/research/
assets trimmed) → deploy succeeded:
lethe-md556mro7-vowctminibro-7069s-projects.vercel.app. The lethe-gold alias
picked up the new production deployment automatically — no alias surgery
needed.

**External checks (REAL public URL, not localhost) — ALL GREEN:**
- `curl https://lethe-gold.vercel.app` → "Memory you own" ×1 in body+title,
  "art collectibles" ×0 · `<title>Lethe — Memory you own</title>`
- /chat /memory /pulse → all HTTP 200
- /og.png → 200, image/png, 23,345 B
- Playwright prod (unauthed, desktop+mobile): h1 "Memory you own." renders,
  sign-in button visible on landing + /chat, **zero console errors**.
  Screenshots → `design/screens/prod/` (4 shots, viewed).
GATE PASSED — lethe-gold serves the NEW app, verified externally.

=== LETHE BLOCK 2 REPORT ===
LLM chain: MiniMax NOT broken — key live (chatcompletion_v2 200 in 2.4s, SSE streaming OK); it was only ever wired to legacy image-gen. Quirks handled: no response_format json_object (err 2013 → prompt-JSON + object-slice), errors as HTTP 200 + base_resp.status_code≠0. Chain now MiniMax → NIM → Groq → Gemini for chat streaming AND extraction, per-request failover (timeout 30s/5xx/429 → next, logged "[llm] … failing over") | failover unit tests 8/8 PASS (mocked MiniMax 500/429/base_resp/hang → NIM serves, both complete+stream); hero-e2e re-passed through chain: provider=minimax/MiniMax-Text-01, fact extracted, blob GbB45iJxmH5F8Si_78GG_macC6WeLS64jXjx7x852Eg, gasless tx 7y3b2dprDCtSbYmc4Fxa47MFVAxrLsWknqEjKU4uAc9m
Brand/OG: apps/web/public/og.png 22.8 KB (1200x630, sharp+SVG, viewed + 1 iteration) | stale "art collectibles" strings in metadata/landing: 0 found locally (lived only on old deployment); BRAND.md verbal identity → v2 exact copy; metadata title "Lethe — Memory you own" + one-liner + OG/Twitter → /og.png + metadataBase
Visual pass: 4 fixes (landing hero v1→v2 "Memory you own.", /chat mobile header wrap → nowrap + chip hidden <sm, dev-tools button hidden in shots, pulse fullPage → viewport) | design/screens/ (12 final shots desktop+mobile, all viewed; round-1 archive design/screens/r1/), zero console errors
Env sync: added MEMORY_ENCRYPTION_SECRET, NEXT_PUBLIC_MEMORY_PACKAGE_ID, NEXT_PUBLIC_MEMORY_ALLOWLISTED to production+preview+development (preview via REST API — CLI non-interactive add loops on git_branch_required). Optional names with safe code defaults intentionally not added (placeholders would change failover behavior)
Deploy: lethe-md556mro7-vowctminibro-7069s-projects.vercel.app | alias OK — lethe-gold.vercel.app picked it up automatically, "Memory you own" ×1 / "art collectibles" ×0 | /chat /memory /pulse all 200 | /og.png 200 image/png 23,345 B
Prod screenshots: design/screens/prod/{landing-desktop,landing-mobile,chat-unauthed-desktop,chat-unauthed-mobile}.png (Playwright vs public URL, unauthed, 0 console errors, sign-in visible)
Blockers: none new — B16 (MemWal SDK 0.0.2 < relayer min 0.0.4) unchanged per block rules, FALLBACK ManualProvider live. Two transient Vercel /v2/files 500s worked around via .vercelignore. GROQ/GEMINI keys still empty (free redundancy waiting on Vow)
Recommended next: (1) Vow does the ONE live browser pass on PROD now that it's the new app: Google sign-in → vault birth → chat → /memory → grant Pulse → /pulse → revoke (only untested seam, now testable on the public URL). (2) 90s demo video against lethe-gold.vercel.app + judge-facing README with the brand-v2 story and Suiscan/Walrus links. (3) Fill GROQ/GEMINI free keys → instant 4-deep chain.
=== END REPORT ===

---

## 2026-06-11 — BLOCK 3A: JUDGE-FACING REPO

=== LETHE BLOCK 3A REPORT ===
README: 129f27f | links verified: https://lethe-gold.vercel.app (200) · Suiscan package 0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331 (page 200 + package object readable via fullnode RPC) · all relative paths (contracts/memory/sources/memory.move, apps/web/src/lib/memory/provider.ts, apps/web/scripts/{hero,pulse,gasless}-e2e.mjs, PROGRESS.md, BLOCKERS.md) exist. Facts corrected vs template: Move entry fns are create/add_entry/grant/revoke (no create_vault), vault object is memory::Memory, stack is Next.js 16 (16.2.6) not 15. No license claimed (no LICENSE file in repo — old README's "Apache 2.0" line was unbacked; flag for Vow if judges expect one).
Repo meta: YES — description "User-owned memory for AI agents — encrypted on Walrus, anchored on Sui. Sui Overflow 2026 · Walrus track.", homepage https://lethe-gold.vercel.app, topics {sui, walrus, ai-agents, ai-memory, zklogin, move, sui-overflow} — verified via gh repo view.
Stale sweep (ac96a86): fixed/annotated — README.md (rewritten), docs/ARCHITECTURE.md + docs/HERO_FLOW.md (LEGACY superseded headers, NPC-SDK era), brand-assets/BRAND.md (LEGACY header, art-collectibles v1 → points to root BRAND.md v2), packages/sdk/README.md + apps/memory-service/README.md + research/legacy/README.md (created, 3-line LEGACY notes). contracts/legacy/README.md already had a proper legacy note — untouched. Left alone deliberately: BLOCK2_PROMPT.md/HERMES_HANDOFF.md/OVERNIGHT-BRIEFING.md/SUI_PILOT_NOTES.md (dated process history, NPC mentions are historical narration), apps/web/next.config.ts (comment documents the re-aim, current), research/*.md (dated research notes), pnpm-lock.yaml (lockfile).
Anything judge-visible still stale: none on the front page or docs/. Minor: no LICENSE file (README intentionally silent); REAIM.md/BATTLE_DESIGN.md describe pivot history by design.
=== END REPORT ===

---

## 2026-06-11 — BLOCK 3B: VERIFIABLE TRUST LAYER

=== LETHE BLOCK 3B REPORT ===
CI: https://github.com/vowctminibro/lethe/actions/runs/27329574087 (first GREEN run; subsequent pushes also green) | .github/workflows/ci.yml: job A = pinned sui CLI mainnet-v1.72.5 (exact local version) + `sui move test` in contracts/memory (6/6); job B = pnpm 10 + node 24 + LLM failover suite 8/8 (mocked fetch, no keys). Badges on README top: CI (live, "passing" verified on main), License Apache-2.0 (shields/github), Sui testnet (links Suiscan package). GATE PASSED. Detour logged: push of workflow file was rejected — gh OAuth token lacked `workflow` scope; ran `gh auth refresh -s workflow` device flow, sent code to Vow via Telegram, Vow approved (~15 min), CI commit held on side branch meanwhile so other pushes stayed unblocked. CI annotation: actions runners flip to Node 24 default on 2026-06-16 — checkout@v4/setup-node@v4/pnpm-action@v4 may want a bump later; harmless now.
Marks: Sui droplet from sui.io/media-kit ONLY — 01_Sui_Logo.zip via the kit's own download link (firebasestorage.googleapis.com/v0/b/standards-site-beta.appspot.com/.../01_Sui_Logo.zip?alt=media&token=963da9ba-a101-43fd-8288-57fee667243e) → Logo_Sui_Droplet_Sui Blue.svg (#298DFF, unmodified). Walrus monogram from the OFFICIAL media kit Drive folder linked in walrus.xyz footer (drive.google.com/drive/folders/1rklvwojMC0NnpkunNySqLgXizHxcmazl) → 02_Walrus_Monogram/SVG/Walrus_Monogram_Black.svg (unmodified). No brandfetch/freepik/redrawn assets. Placements: landing footer "Built on Sui · Stored on Walrus" with both marks (apps/web/public/partners/, clear space via flex gap, light-bg variants per kit rules, never adjacent to the Lethe mark — nav vs footer) + README footer text line. Deployed: vercel deploy --prod → lethe-gold.vercel.app aliased, footer + both SVGs verified live (200 image/svg+xml).
Prover: VERIFIED — sui-prover 1.5.3 (brew asymptotic-code tap), specs in contracts/memory_specs (sibling package, production module untouched, accessor-based since fields are module-private). 13/13 checks green (4 specs × Check/Assume/SpecNoAbortCheck + funs_abort_check). Invariants: I1 owner-only add_entry/grant/revoke (abort iff specified: non-owner, double-grant, unknown-revoke); I2 entries append-only (count+1, new blob at tail, ∀ pre-existing index unchanged via forall!<u64> + #[ext(pure)] helper); I3 grant/revoke leave owner+entries intact; I4 fresh vault = sender-owned, empty. Gotchas solved: clone!() returns &T (no re-borrow); spec's own `+1` needed requires(entry_count < MAX_U64) to pass SpecNoAbortCheck; pure helper must be total (guard both old AND new bounds or funs_abort_check fails). README "Formally verified" section + reproduce cmd added. Used ~40 min of the 90-min box.
Commits: 0f87711 (CI) · 03be2d2 (badges) · dccd25a (marks) · 92e2f1f (prover)
=== END REPORT ===

---

## 2026-06-11 — MINI-BLOCK: LICENSE & STATIC AUDIT

License audit (license-checker --production): apps/web third-party deps CLEAN — MIT 7 · Apache-2.0 4 · ISC 1; the single UNLICENSED hit was our own `web@0.1.0` (no license field — fixed, now Apache-2.0, same for legacy @lethe/sdk + @lethe/shared). Legacy apps/memory-service deps also clean (Apache-2.0 4 · MIT 2 · BSD-2-Clause 1 · ISC 1). No GPL/AGPL/unknown third-party anywhere → no BLOCKERS entry needed.
MoveBit Move Scanner: SKIPPED — movebit.xyz/MoveScanner serves only the corporate page (no scanner app/endpoint reachable, no CLI on npm/pip); per timebox rule, not claiming any static-analysis result.
README: added 3-line Security section (formal verification 16/16 + reproduce cmd, license audit result, independent-audit-pre-mainnet plan, no logos).

---

## 2026-06-11 — BLOCK 5 v2: PRODUCT DEPTH 1

=== LETHE BLOCK 5 REPORT ===
Contract: UPGRADE (not fresh publish — UpgradeCap 0x29e201bc…c0dc held by deployer) · NEW PACKAGE ID 0x06b5c99940b5de954b2b37cd1198f421921986eabd57b35fe3fd4cc39169ba95 (v2; original/defining id 0x9dcc482c…1331 — existing vaults keep working, type filter must keep using the ORIGINAL id; call/type split implemented as MEMORY_PACKAGE_ID + MEMORY_PACKAGE_ORIGINAL in chain.ts, e2e scripts, .env.local, Vercel env prod+preview+dev). remove_entry keyed by (index, blob_id) since blob ids aren't contract-unique; emits MemoryForgotten (NPC-era name resurrected). Move tests 10/10. CLI smoke: add→remove→read shows entry gone + event with correct fields. Toolchain note: testnet protocol 126 forced sui CLI 1.72.5→1.73.1 (old binary backed up as ~/.local/bin/sui-1.72.5.bak); Published.toml now records the publish. Detour: deploy-time sponsor 400 was OUR /api/sponsor allowlist (it passes allowedMoveCallTargets per request), NOT the Enoki portal — added remove_entry target there.
Prover: 16/16 GREEN (was 13/13). I2 now "entries change only by owner add (tail append, prefix unchanged) or owner remove_entry (exactly the asserted (index,blob_id) removed; below: same slot, at/above: shift down one — ∀ via forall!<u64> + total pure helper)". remove_entry spec: owner-only + index-bounds + blob-mismatch aborts mirrored, count-1. README Formally verified updated (16/16 + same reproduce cmd). Used ~15 min of the 60-min box.
Recall: e2e PASSED — hero-e2e extended with session B (fresh recall → greet:true /api/chat): greeting wove "5% position-size cap" + "no leverage" naturally. /chat now keeps a 12-fact digest in the system prompt all conversation + returning users get a woven personal opener (canned opener replaced only if user hasn't typed; new users unchanged).
Forget UI: e2e PASSED (add→gasless remove_entry→recall excludes→on-chain back to baseline, MemoryForgotten emitted, Suiscan tx in toast). /memory: per-entry Forget → honest confirm dialog ("orphaned ciphertext") → optimistic row-out → toast with tx link; rail header in /chat gained "manage / forget" link. Screenshots viewed: design/screens/forget/ (4 shots, 0 console errors). Post-gate fix: MemWalProvider stub needed forget() (type error briefly landed in a56eab9, fixed 4ab7ff1).
Style depth: SHIPPED IN FULL (~45 min of 2 hr) — activity.ts upgraded (RPC only: owned-object type histogram paginated ~200, NFT Display names first 10, move-call kinds with counts); derive route returns 2-4 evidence-citing trait cards + inactive flag for empty wallets (no LLM call, honest copy); chat UI: wallet link AND analyze now produce SUGGESTED cards with [Save]/[Dismiss] — auto-save removed entirely (old analyze() persisted everything silently — that was a sovereignty bug). GATE: 0x4bf2…8077 → 4 sensible cards ("Developer/builder profile: holds 7 UpgradeCaps…", "Battle protocol participant: 6 votes, 5 creations…") verified end-to-end in UI (design/screens/style-depth/, save+dismiss both exercised, 0 console errors). Empty-wallet → "not enough on-chain history yet" verified with a fresh address.
States: 1 fix — "sign-in offline" was the SiteHeader/HeroCTA fallback firing during the Enoki wallet-registration race (and for all unauthed users until registered): now key-present → disabled "Sign in with Google" (no scary flash), key-absent → intentional "Sign in to start". Matrix: 4 routes × desktop/mobile × authed/unauthed = 16 shots → design/screens/states/, all viewed, all intentional, 0 console errors.
Env/Deploy: GROQ_API_KEY + GEMINI_API_KEY both EMPTY in .env.local → skipped Vercel sync (noted; chain still MiniMax→NIM with free-tier redundancy waiting on keys from Vow). vercel deploy --prod → lethe-gold.vercel.app aliased. External: / /chat /memory /pulse all 200; forget-dialog + suggestion-card markup confirmed shipped in prod JS chunks (Playwright network capture); prod unauthed Playwright 0 console errors; full e2e suite vs testnet GREEN (gasless, hero+session-B, forget, pulse).
Blockers: none new. B16 unchanged. Note for soft launch: package is now v2 — any external doc quoting the old package id for CALLS must use 0x06b5…ba95 (Suiscan links to the old id still resolve for history).
Commits: 5c72008 (Step 1) · 31f42eb (1c) · 795b146 (Step 2) · a56eab9+4ab7ff1 (Step 3) · 21485a8 (Step 4) · f36f622 (Step 5)
=== END REPORT ===

---

## 2026-06-11 — BLOCK 6: BRAND IDENTITY PASS "Letterpress on water"

=== LETHE BLOCK 6 REPORT ===
Tokens (ddc1598): Fraunces variable (italic+opsz, weight:"variable" — next/font requires that for axes) · Instrument Sans body 15.5/1.6 · IBM Plex Mono for every id (.lethe-id, +0.08em). Radius law via Tailwind v4 theme override (--radius-xl→4px etc — every rounded-* in the app obeys without touching call sites). Hairline --border rgba(26,58,74,.12) — this also fixed a latent bug: var(--border) was referenced 49× but never defined. Coral reserved for memory (selection + focus rings included). Water contour SVG drift 75-90s ≤6% Mist, .lethe-water/.lethe-divider, hero+dividers only, no gradients. Motion vocab: chip-lift/stamp/inkwash/draw, all killed by prefers-reduced-motion. Gotcha: Turbopack dev served stale CSS after the token rewrite — rm -rf .next required before the classes appeared.
Landing (c675d60): asymmetric editorial — verse hero in Fraunces italic breaking with the poem (3 iterations: 88px→80px→72px+fluid clamp until "Named after the river" held one line on desktop AND no orphan "is." on mobile), memory-constellation line-work right (vault disc + LETHE/PULSE/NEXT/YOURS nodes, coral motes), margin-note pillars (01/02/03, hairline dividers, no cards), colophon footer (· COLOPHON ·, marks, type credits, coral proof link to the vault contract).
/chat (7362b64): Lethe speaks as typeset prose with a hanging italic "L." — no bubble; user notes = ink blocks (color-law fix: was coral text). Rail = INK POOL (#1A3A4A on the paper page): coral kind plates, letterpress-inset confirmed chips, stamp-on-confirm choreography (pending→confirmed tracked per chip), walrus/tx ids as engraved mono plates with copy affordance (⧉→✓). Live lifecycle exercised: typed a fact → chip lifted with coral glow → stamped with both plates.
/memory (5dbb8b9): MEMORY HUB — living constellation: vault disc (italic L + entry count), LETHE spoke always solid with coral motes, PULSE node = grant/revoke toggle ON the map (revoke severs the spoke → dashed, dimmed, motes gone — 0.45s ease, exercised live both directions), dashed open slot "ANY AGENT — SAME MEMORY. CONNECT BELOW." Ledger: engraved hairline rows, mono ids, coral proof links, mono dates. Forget = ink-wash dissolve (.lethe-inkwash, exercised). 0 console errors.
/pulse (07589f2): same press, different publication — italic Fraunces wordmark in Moonlight (Mist-led, was candle sans), mono tagline, display moment "First time here — / and I already know you." italic 4xl, colophon "POWERED BY LETHE MEMORY — A DIFFERENT PUBLICATION FROM THE SAME PRESS".
Vault birth (07589f2): BirthRite overlay — L mark draws itself (stroke-dash .lethe-draw), "VAULT 0x…— BORN ON SUI" in mono, tap-to-skip, auto-settles at 1.7s into the existing header card. Triggers once on phase→born. Visual verified with the real CSS classes.
og.png + BRAND.md (760bb76, 7faca81): OG regenerated — Mist italic verse + Ink "Built so nothing is." + coral stroke + contour line-work (40.5KB). BRAND.md "Visual identity v3" codifies type/shape/color-law/water/motion/voice-anchors; v2 typography block marked superseded.
Default-detector: every surface ≥2 critique rounds (landing 3). The elements no template has: verse-broken italic hero, ink-pool rail, grant-revoke ON a constellation map, ink-wash forget, birth rite.
E2E: gasless (vault 0x0d65da62… created) · hero+session-B · forget · pulse — ALL GREEN, zero feature/IA changes.
Deploy: vercel --prod → lethe-gold.vercel.app. External: 4 routes 200 · Fraunces + Instrument Sans live with next/font fallbacks (25 woff2) · CLS 0.0000 · 0 console errors.
Screens: AFTER → design/screens/brand/ (landing/chat/memory/pulse desktop+mobile + chip-stamped + hub-severed + inkwash + birth). BEFORE → design/screens/states/ + design/screens/prod/ (Block 5-era).
Blockers: none new.
Commits: ddc1598 · c675d60 · 7362b64 · 5dbb8b9 · 07589f2 · 760bb76 · 7faca81
=== END REPORT ===

2026-06-11: HERO PASS (human) — Vow completed the full 9-step flow on prod (incognito, secondary Google account): sign-in, vault birth, chat+chip, proof links, grant→/pulse knows, revoke→forgets, re-login same vault. PASSED.

2026-06-12: history rewritten to purge twitter-growth/ (privacy hygiene; audit confirmed zero credentials ever exposed). SHAs above this line refer to pre-rewrite history.

## 2026-06-12 — BLOCK 8, Phase 1 (Seal spike — de-risk)

**VERDICT: SEAL-GO.** Full encrypt → seal_approve → decrypt round-trip on
testnet, ~25 min into the 3-hr box.

- @mysten/sui compat: installed 2.17.0 ≥ required 2.16.2 — no bump.
  @mysten/seal@1.1.3 added. `SuiJsonRpcClient` exposes `.core` →
  SealCompatibleClient OK (no client migration needed).
- **Key server config (the exact config to reuse):** verified testnet
  DECENTRALIZED server, objectId
  `0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98`,
  aggregatorUrl `https://seal-aggregator-testnet.mystenlabs.com`, weight 1,
  threshold 1, `verifyKeyServers: true`, no API key needed. (Committee-mode
  3-of-5 internally — distributed trust with a single config entry.)
- Throwaway policy published: contracts/seal_spike →
  `0x6e79e87b4df03871b088e9eb1dce4db9720e7ca92c72a0f1bafefe8e5972b97b`
  (owner-only seal_approve; superseded by Phase 2's memory_policy).
- scripts/seal-spike.mjs: 330 B ciphertext · SessionKey (personal-message
  sig, ttl 10 min) · decrypt == original · NEGATIVE: stranger keypair →
  NoAccessError from key servers. Gotcha logged: SealClient caches derived
  keys after a successful decrypt — negative tests (and any per-user
  isolation reasoning) need a fresh client; cache is per-client-instance.
GATE PASSED.

## 2026-06-12 — BLOCK 8, Phase 2 (memory_policy + republish v3)

`memory::memory_policy` shipped — `entry fun seal_approve(id, &Memory, ctx)`:
identity must be `[vault object id][nonce]` (prefix check, canonical Seal
whitelist pattern) AND sender == owner OR on the vault's live `authorized`
vector — the SAME grant state the app already uses, so revoke bites at the
key servers. Move tests 16/16 (6 new: owner allowed, granted-until-revoked,
stranger denied, wrong-vault prefix denied even for owner, entry happy path,
entry abort).

**Republish: UPGRADE to v3** `0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c`
(UpgradeCap 0x29e201bc…c0dc, digest 7otJ5mhpbWZRcpjptSeZkAEBY4F9iCNsmZQEcCL5Ymg5).
Original/defining id unchanged 0x9dcc482c…1331 — existing vaults untouched.

**Seal × upgrade semantics settled empirically** (seal-policy-e2e.mjs, real
vault 0x4737…7655): encrypt + SessionKey MUST use the ORIGINAL package id
(SDK hard-rejects non-v1 packages); the seal_approve PTB targets the LATEST
id; key server normalizes to the first version for the namespace. Owner
round-trip PASS · stranger denied PASS · revoked denied PASS · granted-app
session DENIED at dry-run input resolution → B17 design note (owned vault ⇒
owner-session decryption everywhere; Pulse keeps server-enforced grants).
GATE PASSED (tests, package live, e2e proof). Ids propagated next phase
alongside SealProvider env.

## 2026-06-12 — BLOCK 8, Phase 3 (SealProvider behind the flag)

`SealProvider extends ManualProvider` — grant/revoke/forget + gasless plumbing
inherited untouched; only the crypto plane overridden:
- remember: Seal-encrypt CLIENT-SIDE (`[original pkg][vault id][nonce]`) →
  POST /api/memory/store (new route: pure ciphertext passthrough to Walrus —
  server never sees plaintext or keys) → gasless add_entry (unchanged).
- recall: on-chain refs → browser-direct aggregator fetch (CORS verified
  open) → one batched fetchKeys + decrypt under the cached SessionKey.
  **Mixed-vault support:** blobs that don't parse as Seal EncryptedObject are
  legacy AES entries → routed through the existing server recall, so
  pre-Seal vaults stay fully readable after the flip.
- Key-server protocol detail: requested identities are read OUT OF THE PTB —
  batch decrypt = one seal_approve moveCall per id in a single PTB.
- Flag: NEXT_PUBLIC_MEMORY_PROVIDER=manual(default)|seal|memwal; ManualProvider
  untouched. New module seal.ts (client, config+helpers), seal-session.ts
  (SessionKey cache: sessionStorage, TTL 30 min, in-flight dedupe — at most
  ONE signature per session), seal-provider.ts, /api/memory/store.

**GATE PASSED** (seal-provider-e2e.mjs — the real src modules on testnet):
blob mRA2FRf9EmFMLdcQGO-lPjoSfRrqQ4ot-q9NGtdeWJ4 (433 B Seal ciphertext,
services=1, id prefix == vault) · gasless add_entry
5SYLh9YugYw5EHvTG3RDScBjxY6VkcHngAAp9byndd7G (sponsor ≠ signer) · recall
decrypted the new entry verbatim AND 2 legacy AES entries via fallback.
`tsc` clean · `pnpm build` GREEN. .env.local → v3 call id + provider=seal
(local only; prod flips in Phase 5).

## 2026-06-12 — BLOCK 8, Phase 4 (SessionKey UX — signing without killing gasless)

**Signature budget, measured** (seal-session-ux-e2e.mjs): remember = 0
personal-message signatures (writes never touch the decrypt key — gasless
sponsor flow unchanged, sponsor ≠ signer verified); recall ×3 (two PARALLEL +
one sequential) = exactly 1 signature. Mechanics: SessionKey cached in
sessionStorage (TTL 30 min, export/import) + in-memory fallback for
storage-blocked contexts + in-flight dedupe so parallel recalls share one
signing. First run caught a real gap — node/storage-blocked sessions re-signed
per recall (2 sigs) — fixed with the in-memory layer, re-measured 1.

**UI**: quiet "unlocking your memories…" line in the ink-pool rail while the
one-time signature lands (useSealUnlocking → useSyncExternalStore over
seal-session's unlock store, zero Seal knowledge in components). Sign-out now
clears the cached session key (SiteHeader).

**Pulse in seal mode**: /api/pulse/recall keeps the on-chain grant gate (403
on revoke unchanged) but returns Seal blobs flagged `sealed: true` instead of
failing; the page decrypts those with the owner's cached session and merges
(B17 decision wired). zkLogin signing is silent through the Enoki wallet —
same plumbing as the proven signTransaction path; the one un-automatable
browser OAuth pass stays on the known-seam list (Vow's hero pass covers it).
`tsc` clean · `pnpm build` GREEN.

## 2026-06-12 — BLOCK 8, Phase 5 (prover + honest copy + Seal in prod)

Prover: **19/19** (was 16/16) — new `memory_policy_specs::seal_approve_spec`
proves I5 deny-universality: seal_approve ABORTS for every sender that is
neither owner nor currently authorized, for ALL identities (with I3 this is
revoke = key servers stop approving, by proof). The approve direction is not
expressible externally (`object::id().to_bytes()` is uninterpreted in the
prover model — two attempts documented) and stays covered by the 6 unit tests.
Spec gotcha logged: spec params MUST reuse the target's parameter names or the
prover binds fresh symbols.

Copy now TRUE and shipped: README (browser-side Seal encrypt, e2e claim,
19/19, roadmap → selective sharing + shared-registry policy), /memory line,
landing pillar 02. Manual fallback retained + disclosed.

Prod flip: NEXT_PUBLIC_MEMORY_PROVIDER=seal + v3 package id upserted to
production/preview/development. Deploy lethe-qytlqf2xs… → lethe-gold.vercel.app.

External verify (public URL): 4 routes 200 · Seal key-server config + v3 id
confirmed inside shipped JS chunks · **Seal-mode write+recall run AGAINST PROD**
(seal-provider-e2e with E2E_BASE=https://lethe-gold.vercel.app): blob stored
via prod /api/memory/store, gasless add_entry 83x7NaJ5b1FDgEpQr3Ba2qyEMYAm7sbD2TVAQfkTGAet,
recall decrypted new + 7 legacy entries · Playwright unauthed desktop+mobile:
0 console errors, sign-in visible (shoot-prod hero assertion updated for the
Block 6 verse). Full suite re-run on v3 beforehand: gasless · hero+session-B ·
forget · pulse · seal-policy · seal-provider · seal-ux — ALL GREEN.

=== LETHE BLOCK 8 REPORT ===
Phase 1 verdict: SEAL-GO — testnet round-trip ~25 min in. Key server config: verified decentralized testnet server 0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98, aggregator https://seal-aggregator-testnet.mystenlabs.com, weight 1, threshold 1 (committee 3-of-5 internally), no API key. Spike: 330B ciphertext, decrypt==original, stranger → NoAccessError. Gotcha: SealClient caches derived keys — negative tests need a fresh client.
@mysten/sui compat: was 2.17.0 ≥ 2.16.2 required — OK, no bump. @mysten/seal@1.1.3 installed; SuiJsonRpcClient exposes .core → SealCompatible.
Policy + republish: memory::memory_policy (seal_approve: vault-id prefix + owner||authorized, canonical whitelist pattern) · UPGRADE to v3 0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c (UpgradeCap held; original id 0x9dcc482c…1331 unchanged, vaults untouched) · Move tests 16/16 (6 new policy tests) · empirical Seal-upgrade semantics: encrypt/Session = ORIGINAL id (SDK hard-requires v1), PTB targets LATEST; key server normalizes. B17: key-server dry-run rejects owned-object inputs for non-owner senders → owner-session decryption everywhere, Pulse keeps server-enforced grants.
SealProvider: ROUND-TRIPS on testnet AND against prod. extends ManualProvider (grant/revoke/forget untouched); client-side encrypt → /api/memory/store passthrough (server never sees plaintext/keys) → gasless add_entry; recall = aggregator fetch (browser-direct) + batched fetchKeys + decrypt; legacy AES blobs auto-detected → server fallback (old vaults readable).
UX signing: 0 signatures for writes (gasless untouched, sponsor≠signer verified), EXACTLY 1 per session for reads — measured: remember + 3 recalls (2 parallel) = 1 personal-message signature (sessionStorage TTL 30min + in-memory fallback + in-flight dedupe; first run caught storage-blocked re-signing, fixed). Quiet "unlocking your memories…" rail state; sign-out clears the session key. zkLogin signs silently via Enoki (same plumbing as proven signTransaction).
Prover: 19/19 (new I5 deny-universality on seal_approve; approve direction covered by unit tests — to_bytes uninterpreted in model).
Deploy: lethe-qytlqf2xs-vowctminibro-7069s-projects.vercel.app → lethe-gold.vercel.app · prod provider=seal CONFIRMED (key-server config + v3 id in shipped chunks; Seal write+recall executed against the public URL) · / /chat /memory /pulse 200 · Playwright unauthed 0 console errors.
Copy updated: YES, now true — README "End-to-end encrypted with Seal threshold encryption: even Lethe's servers can't read your memories; decryption requires on-chain policy approval", /memory line, landing pillar; old server-holds-key caveat removed; one-line ManualProvider-fallback note kept; framing everywhere "Lethe USES Seal" (Mysten infra).
Blockers: B17 (design note, handled — owned vault ⇒ owner-session decrypt; shared-registry policy on roadmap for true third-party app sessions). None blocking. NOTE for Vow: a concurrent root-cleanup lane (PR #1) raced Phase 3 mid-block — recovered, everything merged; PROGRESS/BLOCKERS now live at docs/.
Recommended next: (1) Vow re-runs the ONE human browser pass on prod in Seal mode (sign-in → chat → watch "unlocking your memories…" → /memory → grant/revoke → /pulse) — the OAuth seam is still the only thing agents can't click. (2) Soft-launch copy/demo can now lead with provable e2e encryption + 19/19. (3) Post-launch: shared-registry policy (kills B17), Seal-gated selective sharing, MemWal ≥0.0.4 adapter.
=== END REPORT ===

# Lethe wiring/completeness audit — 2026-05-31 (overnight, read-only)

Verdict: the full **create → own → battle** loop is **wired end-to-end, not stubbed**.
No placeholders ship in the live path. Package IDs + entry fns match on-chain.

## Component table

| Component | State | Evidence (file:line) |
|---|---|---|
| Walrus UPLOAD (publisher PUT → blobId) | **PRESENT** | `src/lib/walrus.ts:38` `store()` → `PUT ${PUBLISHER_URL}/v1/blobs?epochs=` (`:45-46`); route `app/api/store/route.ts:21` `blobId = await store(bytes)` |
| Walrus blobId used at mint (real, not constant) | **PRESENT** | `app/create/page.tsx:182` POST `/api/store` → `:189` `current = { blobId: sj.blobId … }` → `:197` `mint({ blobId: current.blobId … })` |
| Walrus READ (images via aggregator) | **PRESENT** | proxy `app/api/img/[blobId]/route.ts:27` GET `${AGGREGATOR_URL}/v1/blobs/`; `/me` renders via `blobUrl()` `app/me/page.tsx:13` |
| MiniMax (server-side only, key off client) | **PRESENT** | `src/lib/minimax.ts:11,33` `image_generation`, `process.env.MINIMAX_API_KEY`; only reached via `src/lib/generate.ts:10,25` ← `app/api/generate/route.ts:2,15`. No client import of minimax (grep clean). |
| Enoki zkLogin (register + sign-in + sponsor) | **PRESENT** | register `src/lib/enoki.ts:15,36,40`; provider `app/providers.tsx:21,32`; sign-in `src/components/SiteHeader.tsx:27` (`isGoogleWallet`); sponsor `app/api/sponsor/route.ts:34,45,59` (`EnokiClient.create/executeSponsoredTransaction`) |
| Slush wallet (secondary sign-in) | **PRESENT** | `src/components/SiteHeader.tsx:29,57-65` (auto-detected via wallet-standard, subordinate "Connect Slush") |
| Sui mint (artwork::mint, real blobId, gasless) | **PRESENT** | `src/lib/sui.ts:33` `MINT_TARGET=…::artwork::mint`, builder `:45`; `src/lib/mint.ts` runs build→sponsor→sign→execute, returns objectId+gasOwner |
| Battle vote (per-address dedup) | **PRESENT** | `src/lib/battle.ts:16` `VOTE_TARGET=…::battle::vote`; dedup enforced on-chain (VecSet) per the published module |
| Battle resolve/close | **PRESENT** | `src/lib/battle.ts:18` `RESOLVE_BATTLE_TARGET=…::battle::resolve_battle`; `useBattleActions.resolve` in `src/lib/vote.ts` |
| Leaderboard counts REAL wins | **PRESENT** | `src/lib/indexer.ts:148-168` — wins only from `status === 1` (closed) with decisive `winnerSide` 0/1; ties/open excluded; rank wins → rarity |

## Red-flag checks

- **Placeholders in live path:** NONE. `grep -rnE "demoblob|lethe-xxxx|TODO|FIXME|localhost|127.0.0.1|example.com" app src` (excl node_modules/.next) → 0 matches. The historical `demoblob`/`smoke_blob_validation` values exist ONLY on two past on-chain test objects + in docs (HERMES_HANDOFF.md ledger), never in shipping code. Real path uploads the generated image → uses the returned blobId.
- **Package IDs:** code reads them from env (`NEXT_PUBLIC_ARTWORK_PACKAGE_ID`, `NEXT_PUBLIC_BATTLE_PACKAGE_ID`), set to the canonical ids in `.env.local` + Vercel prod. No wrong/hardcoded ids.
- **Entry fn names match on-chain:** artwork → `mint` ✓; battle → `create_battle`, `resolve_battle`, `vote` ✓ (verified via `sui_getNormalizedMoveModule`).
- **On-chain existence (testnet, getObject):**
  - artwork `0xea40338dececbdaacf834cbbdd54187cc73ff874944f81e9e815f253b813e1f1` → `package` ✓
  - battle `0x1e7048dcb7592991e7da775e6516d4755a3ca07f5d71b898ae173d95ddfdc983` → `package` ✓
- **Secrets:** `.env.local` gitignored + untracked. `git grep` for secret literals across tracked files → only truncated prefixes in docs (`sk-cp-QSN6AR…`) + comments in the **deprecated** memory-service; no full/usable secret committed.

## Notes
- The deprecated `apps/memory-service` (old NPC/storytelling backend) still contains
  `suiprivkey1…`-format COMMENTS (no actual key) — not in the web app, not in the demo path.
- Gasless verified end-to-end previously (mint + vote + resolve sponsored, gas paid by Enoki sponsor `0x0dec…`), signed by an ed25519 key — so Slush (ed25519) also routes gasless through the same sponsor.

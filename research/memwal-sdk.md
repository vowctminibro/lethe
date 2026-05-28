# MemWal SDK Research — 2026-05-28T12:51:14Z

## Package name (confirmed)
- npm: `@mysten-incubation/memwal`
- Install: `pnpm add @mysten-incubation/memwal`
- Current version: **0.0.5** (published May 25, 2026 — 2 days ago at time of research)
- Weekly downloads: ~1.0K
- Total versions published: 29
- First published: Mar 25, 2026
- License: Apache-2.0
- Source: https://www.npmjs.com/package/@mysten-incubation/memwal

## Peer Dependencies (install separately)
```bash
pnpm add @mysten/sui @mysten/seal @mysten/walrus ai zod
```

## Quickstart code from docs

```ts
import { MemWal } from "@mysten-incubation/memwal";

const memwal = MemWal.create({
  key: "<your-ed25519-private-key>",         // Ed25519 delegate key hex
  accountId: "<your-memwal-account-id>",      // MemWalAccount object ID on Sui
  serverUrl: "https://relayer.staging.memwal.ai", // testnet relayer
  namespace: "demo",
});

// Health check
await memwal.health();

// Store a memory
await memwal.remember("User prefers dark mode and works in TypeScript.");

// Store + wait for completion
const result = await memwal.rememberAndWait(
  "User prefers dark mode.",
  undefined,
  { timeoutMs: 30_000 }
);
// Returns: { id, job_id, blob_id, owner, namespace }

// Recall by natural language
const memories = await memwal.recall("What do we know about this user?", {
  topK: 10,
  maxDistance: 0.7,
});
// Returns: { results: [{ blob_id, text, distance }], total }
```

## Env vars needed
```env
MEMWAL_PRIVATE_KEY=<ed25519-hex-key>
MEMWAL_ACCOUNT_ID=<MemWalAccount-object-id>
MEMWAL_SERVER_URL=https://relayer.staging.memwal.ai  # testnet
# For mainnet:
# MEMWAL_SERVER_URL=https://relayer.memwal.ai
```

## Account creation (how to get accountId + key)
1. Go to **memwal.ai** or **memwal.wal.app** (Walrus-hosted Playground)
2. Connect Sui wallet
3. Create account → generates Ed25519 delegate key + MemWalAccount object ID
4. OR self-host: deploy contract + generate delegate key manually

⚠️ **For testnet**: use staging endpoint `https://staging.memwal.ai` or `https://relayer.staging.memwal.ai`

## Sui Testnet Contract IDs
```
SUI_NETWORK=testnet
MEMWAL_PACKAGE_ID=0xcf6ad755a1cdff7217865c796778fabe5aa399cb0cf2eba986f4b582047229c6
MEMWAL_REGISTRY_ID=0xe80f2feec1c139616a86c9f71210152e2a7ca552b20841f2e192f99f75864437
```

## API surface (top 8 methods)

1. `MemWal.create(config)` — Initialize client with key + accountId + serverUrl + namespace
2. `memwal.remember(text, namespace?)` — Submit one memory async (returns job_id immediately)
3. `memwal.rememberAndWait(text, namespace?, opts?)` — Submit + poll until done (returns blob_id)
4. `memwal.rememberBulk(items)` — Submit up to 20 memories in one request
5. `memwal.recall(query, limit?, namespace?)` — Semantic search, returns decrypted plaintext results
6. `memwal.analyze(text, namespace?)` — LLM extracts facts from text → stores each as separate memory
7. `memwal.restore(namespace, limit?)` — Rebuild missing indexed entries from Walrus (incremental)
8. `memwal.health()` — Relayer health check (no auth required)

## Three entry points

| Entry | Import | Use case |
|---|---|---|
| `MemWal` | `@mysten-incubation/memwal` | Default — relayer handles embedding + SEAL + Walrus |
| `MemWalManual` | `@mysten-incubation/memwal/manual` | Client-side embedding + local SEAL encryption |
| `withMemWal` | `@mysten-incubation/memwal/ai` | Vercel AI SDK middleware — auto recall/save |

## Source links
- Docs: https://docs.memwal.ai
- GitHub: https://github.com/MystenLabs/MemWal
- npm: https://www.npmjs.com/package/@mysten-incubation/memwal
- Twitter/X: No confirmed @memwal account found (no active Twitter presence in search)

## Health check
- docs.memwal.ai accessible: **YES** ✅
- Package on npm: **YES** ✅ (@mysten-incubation/memwal v0.0.5)
- Last commit on GitHub: **2026-04-30** (28 days ago — active)
- TypeScript first-class: **YES** ✅ (primary language, 83.3% of repo)
- Testnet relayer live: **YES** ✅ (https://relayer.staging.memwal.ai confirmed)
- GitHub stars: 13 | Forks: 4 | Contributors: 9

## How to run MemWal locally (dev mode)
```bash
git clone https://github.com/MystenLabs/MemWal
cd MemWal
pnpm install
pnpm build:sdk
pnpm dev:app      # Playground dashboard
pnpm dev:noter    # Note-taking example
pnpm dev:chatbot  # Chat example
pnpm dev:researcher  # Research assistant example
```

## Lethe integration path

Based on Lethe's app structure, integration should use the existing stub at:
`~/Projects/lethe/apps/web/src/lib/memwal.ts`

Steps for Day 3:
1. `pnpm add @mysten-incubation/memwal @mysten/sui @mysten/seal @mysten/walrus ai zod`
2. Replace stub content with actual MemWal SDK code
3. Create MemWal account at memwal.ai (testnet) → get key + accountId
4. Set env vars: `MEMWAL_PRIVATE_KEY`, `MEMWAL_ACCOUNT_ID`, `MEMWAL_SERVER_URL`
5. Integrate `memwal.remember()` after `walrus.storeChapterBlob()` succeeds
6. Integrate `memwal.recall()` on app load to restore story context

## Concerns / blockers

| Issue | Severity | Detail |
|---|---|---|
| Beta status | ⚠️ MEDIUM | MemWal is beta — API may change. Version 0.0.5 with 29 releases in 2 months = rapid iteration. Pin exact version in package.json |
| SPOF on hosted relayer | ⚠️ MEDIUM | Using hosted relayer at staging.memwal.ai = single relayer operator. v2 self-host planned per earlier audit |
| WAL cost unclear | ⚠️ LOW | Storage deposits cost WAL — need to check actual cost per blob/memory operation. 0.5 SUI exchanged but WAL balance not captured |
| GitHub small (13 stars) | ℹ️ INFO | Very early-stage project. Last push 28 days ago — still active |
| No active Twitter | ℹ️ INFO | No @memwal Twitter found. Community is GitHub-based. Unknown community size |
| Ed25519 key management | 🔴 ACTION NEEDED | Need to generate delegate key and store securely. Key = secret. Cannot be committed to repo |
| Account creation flow | 🔴 ACTION NEEDED | Must use memwal.ai playground OR self-host contract deploy to get accountId. No CLI `memwal deploy` found in docs |

## Action items before Day 3 integration
1. [ ] Visit memwal.ai → create testnet account → capture key + accountId
2. [ ] Add env vars to `.env.local`: `MEMWAL_PRIVATE_KEY`, `MEMWAL_ACCOUNT_ID`, `MEMWAL_SERVER_URL=https://relayer.staging.memwal.ai`
3. [ ] Update memwal.ts stub with real SDK code
4. [ ] Test `memwal.health()` to verify relayer connectivity
5. [ ] Pin `@mysten-incubation/memwal@0.0.5` in package.json (don't use ^ latest)

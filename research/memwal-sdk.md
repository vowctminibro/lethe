# MemWal SDK Research — 2026-05-28T21:05+07:00

> Blocked B2 confirmed unblocked via npm + GitHub. Docs site (docs.memwal.ai) unreachable from this Mac Mini — using npm + GitHub as primary sources.

---

## Package name (confirmed)

| Field | Value |
|---|---|
| **npm package** | `@mysten-incubation/memwal` |
| **Install command** | `pnpm add @mysten-incubation/memwal` |
| **Current version** | `0.0.5` |
| **Published** | May 25, 2026 (29 total versions, first published Mar 25, 2026) |
| **Unpacked size** | 214.1 KB (46 files) |
| **Weekly downloads** | ~1,000 |
| **License** | Apache-2.0 |
| **Primary source** | [npm](https://www.npmjs.com/package/@mysten-incubation/memwal) |

**DO NOT confuse with** `@mysten-incubation/oc-memwal` (v0.0.2) — that's the OpenClaw plugin, not this SDK.

---

## Peer dependencies (required alongside the main package)

```bash
pnpm add @mysten-incubation/memwal @mysten/sui @mysten/seal @mysten/walrus ai zod
```

- `@mysten/sui` >=2.5.0
- `@mysten/seal` >=1.1.0
- `@mysten/walrus` >=1.0.3
- `ai` >=4.0.0
- `zod` ^3.23.0

---

## Quickstart code from npm README

```ts
import { MemWal } from "@mysten-incubation/memwal";

const memwal = MemWal.create({
  key: process.env.MEMWAL_PRIVATE_KEY!,
  accountId: process.env.MEMWAL_ACCOUNT_ID!,
  serverUrl: process.env.MEMWAL_SERVER_URL ?? "https://relayer.memwal.ai",
  namespace: "demo",
});

await memwal.rememberAndWait(
  "User prefers dark mode and uses TypeScript.",
  undefined,
  { timeoutMs: 30_000 },
);
const memories = await memwal.recall("What are the user's preferences?", {
  topK: 10,
  maxDistance: 0.7,
});
await memwal.restore("demo");
```

**Note:** npm README uses `MEMWAL_PRIVATE_KEY` env var name. GitHub README uses `your-delegate-key-hex` and `key` param. The key is the Ed25519 delegate private key as hex string.

---

## API surface (top methods)

From npm exports + GitHub README:

1. **`MemWal.create(config)`** — Static factory. Config: `key` (hex string), `accountId` (0x...), `serverUrl` (relayer URL), `namespace` (string)
2. **`rememberAndWait(text, metadata?, options?)`** — Store a memory synchronously. Returns when Walrus upload confirmed. `timeoutMs` option (default: relayer timeout)
3. **`recall(query, options?)`** — Semantic search. Options: `topK` (default 10), `maxDistance` (default 0.7 cosine distance threshold). Returns plaintext memories
4. **`restore(namespace)`** — Rebuild missing indexed entries for one namespace (incremental recovery)
5. **`remember(text, metadata?)`** — Async fire-and-forget variant of `rememberAndWait`

### Entry points (three exports)

| Entry | Client | Who handles embedding/encryption |
|---|---|---|
| `@mysten-incubation/memwal` | `MemWal` (default) | Relayer |
| `@mysten-incubation/memwal/manual` | `MemWalManual` | You (local SEAL + embedding) |
| `@mysten-incubation/memwal/ai` | Vercel AI SDK middleware | Relayer |

---

## Source links

- npm: https://www.npmjs.com/package/@mysten-incubation/memwal
- GitHub: https://github.com/MystenLabs/MemWal (stars: 13, forks: 4, last push: Apr 30 2026)
- Docs: https://docs.memwal.ai (unreachable from this Mac Mini — confirmed via CDP attempt)
- LLM-friendly docs: https://docs.memwal.ai/llms.txt (structured overview)
- Twitter/X: none confirmed — no @memwal handle found in search

---

## Health check

| Check | Status | Notes |
|---|---|---|
| docs.memwal.ai accessible | **NO** | Times out from Mac Mini. Chrome can reach it (tab confirmed at https://memwal.ai/). Likely Mac Mini network routing issue. |
| Package on npm | **YES** | v0.0.5, published May 25 2026 |
| GitHub activity | **YES** | Last push: Apr 30 2026, 9 contributors, active |
| Last npm publish | **3 days ago** | Fresh (May 25 2026) |
| TypeScript first-class | **YES** | Main entry: index.js with TypeScript types; 46 files; peer dep on ai+zod |
| OpenClaw plugin separate | **YES** | `@mysten-incubation/oc-memwal` v0.0.2 — different package |

---

## How it works (from GitHub README)

1. **Scope** — Each memory op runs inside an `owner + namespace` boundary
2. **Store** — Relayer embeds text → encrypts → uploads to Walrus → stores vector metadata in PostgreSQL
3. **Recall** — Searches by owner + namespace → resolves matching blobs → returns plaintext
4. **Restore** — Incrementally rebuilds missing indexed entries for one namespace

**Relayer** = `https://relayer.memwal.ai` (default). You can self-host the relayer (docs at `/relayer/self-hosting.md`).

---

## Concerns / blockers

**Blocker B2 status: UNBLOCKED** — package name confirmed, install command confirmed, API surface confirmed.

### ⚠️ Red flags

1. **Docs site unreachable from Mac Mini** — `docs.memwal.ai` times out via curl/urllib. Chrome on the same machine CAN reach it (tab confirmed). CDP navigation to it also times out. This is a known Mac Mini routing issue for CDN-backed doc sites. **Workaround:** use `docs.memwal.ai/llms.txt` (plain text, may be reachable) or use npm README as primary reference until Mac Mini network issue is resolved.

2. **v0.0.5 — very early stage** — No major version yet. Beta label in README. API may change between minor versions. `rememberAndWait` vs `remember` (async) distinction matters — only use the `*AndWait` variant for reliable store confirmation.

3. **~1,000 weekly downloads** — Low adoption. Community size unknown. Support channels unclear.

4. **Key param name inconsistency** — npm README uses `MEMWAL_PRIVATE_KEY` env var. GitHub quickstart uses `key` param with hex string. Our `.env.example` uses `MEMWAL_DELEGATE_KEY`. Standardize on `MEMWAL_DELEGATE_KEY` matching our existing naming, but note the actual key is Ed25519 private key in hex format.

5. **No delegate key creation flow in SDK** — MemWal account creation requires `memwal.ai` web UI (Sui wallet connect → create account → capture Ed25519 delegate key + object ID). Vow must do this manually. This was listed as Action 1 in Day 3 prep. No CLI/API for account creation yet.

6. **Sui testnet only** — MemWal currently only supports Sui testnet. No mainnet mentioned.

---

## Next action for Vow

To complete MemWal setup (Action 1 from Day 3 prep):

1. Open `https://memwal.ai` in Chrome (not Hermes CDP — docs site is unreachable from Mac Mini shell but works in browser)
2. Click "Connect Wallet" → connect with `lethe-dev` wallet (0x4bf22d...)
3. Create MemWal account
4. Capture: `MEMWAL_ACCOUNT_ID` (0x... object ID) + `MEMWAL_DELEGATE_KEY` (Ed25519 private key hex)
5. Add to `~/Projects/lethe/apps/web/.env.local`

Then update `src/lib/memwal.ts` with actual key names (`MEMWAL_DELEGATE_KEY`, `MEMWAL_ACCOUNT_ID`, `NEXT_PUBLIC_MEMWAL_RELAYER_URL`).
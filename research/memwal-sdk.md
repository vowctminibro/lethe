# MemWal SDK Research — 2026-05-28T18:15:00+07:00

## Package name (confirmed)
- **npm**: `@mysten-incubation/memwal` (direct) | `@mysten-incubation/oc-memwal` (OpenClaw plugin)
- **Install**: `pnpm add @mysten-incubation/memwal`
- **Peer deps**: `pnpm add @mysten/sui @mysten/seal @mysten/walrus ai zod`
- **Current version**: v0.0.5 (SDK) | v0.0.2 (OpenClaw plugin, Apr 30 2026)
- **Source confirming this**: github.com/MystenLabs/MemWal (last push Apr 30 2026)
- **npm on npmjs.com**: Confirmed via GitHub README. Direct npm search for "memwal" returned no results in top matches — package may be published but not indexed heavily. GitHub README is authoritative source.

## Quickstart code from docs

```ts
import { MemWal } from "@mysten-incubation/memwal";

const memwal = MemWal.create({
  key: "your-delegate-key-hex",
  accountId: "your-memwal-account-id",
  serverUrl: "https://your-relayer-url.com",
  namespace: "demo",
});

await memwal.remember("User prefers dark mode and uses TypeScript.");
const memories = await memwal.recall("What are the user's preferences?");
await memwal.restore("demo");
```

## API surface (top 10 methods)

1. **`MemWal.create(config)`** — Factory: create MemWal client with Ed25519 delegate key + Sui account ID + relayer URL
2. **`remember(text, namespace?)`** — Submit one memory async; returns job_id immediately (embedding + encryption + Walrus upload + indexing runs in background)
3. **`rememberAndWait(text, namespace?, opts?)`** — Submit and poll until done; returns `{ id, blob_id, owner, namespace }`
4. **`rememberBulk(items)`** — Submit up to 20 memories in one request; returns `job_ids[]`
5. **`recall(query, limit?, namespace?)`** — Semantic search scoped to owner + namespace; returns `{ results: [{ blob_id, text, distance }] }`
6. **`analyze(text, namespace?)`** — LLM extract memorable facts from text, store each as a job
7. **`restore(namespace, limit?)`** — Rebuild missing vector index entries incrementally from Walrus for a namespace
8. **`health()`** — Relayer health check; no auth required
9. **`getPublicKeyHex()`** — Return hex-encoded public key for delegate keypair
10. **`MemWalManual`** (from `@mysten-incubation/memwal/manual`) — Client-side embedding + SEAL encryption variant; relayer still handles upload/search/restore

### Bonus: Vercel AI SDK middleware

```ts
import { withMemWal } from "@mysten-incubation/memwal/ai";
```

Wraps `streamText`/`generateText` from Vercel AI SDK — auto `recall()` before generation, auto `remember()` after. Perfect for Lethe's storytelling loop.

### Bonus: OpenClaw plugin

```bash
openclaw plugins install @mysten-incubation/oc-memwal
```

For OpenClaw agents — persistent encrypted memory via MemWal with automatic recall/capture hooks.

## Source links
- Docs: https://docs.memwal.ai
- GitHub: https://github.com/MystenLabs/MemWal
- npm: Not independently searchable (GitHub README is source of truth)
- Twitter/X: @memwal (unconfirmed — no active account found)

## Health check
- docs.memwal.ai accessible: **YES** (accessible, serves docs)
- Package on npm: **YES** (via GitHub README, v0.0.5)
- Last commit on GitHub: **2026-04-30** (Apr 30, 2026 — ~28 days ago as of May 28)
- TypeScript first-class: **YES** (primary language: TypeScript 83.3%)
- npm weekly downloads: **TODO — npm search returned no direct results; may be low-volume**

## Configuration requirements

```ts
MemWal.create({
  key: string,          // REQUIRED — Ed25519 delegate private key (hex)
  accountId: string,     // REQUIRED — MemWalAccount object ID on Sui
  serverUrl: string,     // OPTIONAL — relayer URL (default: http://localhost:8000)
  namespace: string,     // OPTIONAL — default "default"
})
```

**Two ways to use:**
1. **MemWal** (default) — relayer handles embedding, encryption, Walrus upload/download, retrieval, restore. You just call `remember`/`recall`.
2. **MemWalManual** — you handle embedding + SEAL encryption locally. Relayer still does upload relay, registration, search, restore.

## Concerns / blockers

1. **⚠️ RELAYER = SINGLE POINT OF FAILURE**: MemWal is a **centralized relayer** (`relayer.memwal.ai`). All embedding, encryption, WAL upload, search, and restore go through this one service. If it goes down, all memories are inaccessible. For hackathon demo this is fine, but for production this is a critical architectural risk.

2. **⚠️ Beta / Active Development**: README explicitly states "MemWal is currently in beta and actively evolving." Last commit Apr 30, 2026. The API could change before mainnet.

3. **Ed25519 delegate key required**: You need to generate an Ed25519 keypair and register a `MemWalAccount` Sui object on-chain before using. This is a setup step Vow must do manually (see memwal-sdk.md setup notes).

4. **No free tier confirmed for relayer**: The relayer at `relayer.memwal.ai` appears to be a managed service. It's unclear if there's a free tier or if Vow needs to self-host the relayer for production. For hackathon, the public relayer likely works.

5. **OpenClaw plugin published more recently**: Latest release (Apr 30 2026) is actually the OpenClaw plugin (`@mysten-incubation/oc-memwal@0.0.2`), not the core SDK. Check if core SDK release is also recent.

6. **docs.memwal.ai shows LLM-friendly docs** (`llms.txt`, `llms-full.txt`) — good sign for AI tooling integration.

## Verdict for Lethe

**Use case fit: HIGH** — `withMemWal` Vercel AI SDK middleware is exactly what Lethe's storytelling loop needs. AI generates story → `remember()` saves to MemWal/Walrus → `recall()` retrieves relevant memories for next session → seamless narrative continuity.

**Recommended path for hackathon:**
1. Use default `MemWal` (not Manual) — fastest to integrate
2. Deploy MemWalAccount on Sui testnet first (setup blocker)
3. Use public relayer `https://relayer.staging.memwal.ai` for testnet
4. Test `withMemWal` AI middleware in story generation flow
5. If relayer is unreliable, fall back to direct `@mysten/walrus` blob storage

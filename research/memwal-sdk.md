# MemWal SDK Research — 2026-05-28T21:36+07:00

## Package name (confirmed)
- npm: `@mysten-incubation/memwal`
- Install: `pnpm add @mysten-incubation/memwal`
- Current version: `0.0.5`
- Source: [npmjs.com/@mysten-incubation/memwal](https://www.npmjs.com/package/@mysten-incubation/memwal)
- GitHub: [MystenLabs/MemWal](https://github.com/MystenLabs/MemWal) — 13 stars, last push 2026-04-30
- Docs: [docs.memwal.ai](https://docs.memwal.ai)

## Credentials (set after Vow wallet onboarding 2026-05-28)

> ⚠️ Stored in `.env.local` — NEVER commit this file

- **Account ID (public key):** `fb59e6b49067f4f87f3b23628007e4c34caaef1bd54383c9787353c9475c3338`
- **Delegate Key (private hex):** `6aa98af5e525d9c78abdfe968c96a7311a0b9cba0c017a157d12840b6cc86f01`
- **Relayer URL:** `https://relayer.memwal.ai`
- **Connected wallet:** `0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077` (lethe-dev, Sui testnet)

## Quickstart code from docs

```ts
import { MemWal } from "@mysten-incubation/memwal";

const memwal = MemWal.create({
  key: "<your-ed25519-private-key>",    // Delegate key hex
  accountId: "<your-memwal-account-id>", // Public key hex
  serverUrl: "https://relayer.memwal.ai",
  namespace: "demo",
});

// Health check
await memwal.health();

// Store a memory
const job = await memwal.remember("User prefers dark mode.");
await memwal.waitForRememberJob(job.job_id);

// Recall memories
const result = await memwal.recall("What are the user's preferences?");
console.log(result.results);
```

## API surface (top 5 methods)

1. `MemWal.create(config)` — Initialize client with delegate key + account ID
2. `memwal.remember(text, options?)` — Store encrypted memory to Walrus (returns job)
3. `memwal.waitForRememberJob(jobId)` — Wait for on-chain confirmation
4. `memwal.recall(query, options?)` — Semantic search over stored memories
5. `memwal.health()` — Verify relayer connection and credentials

## Source links
- Docs: https://docs.memwal.ai
- GitHub: https://github.com/MystenLabs/MemWal
- npm: https://www.npmjs.com/package/@mysten-incubation/memwal
- Playground: https://memwal.ai (connected wallet: lethe-dev 0x4bf22...8077)
- Staging Relayer: https://relayer.staging.memwal.ai

## Health check
- docs.memwal.ai accessible: YES ✅
- Package on npm: YES ✅ (v0.0.5, 2025-10-09)
- GitHub last commit: 2026-04-30 (2 months ago — active enough)
- TypeScript first-class: YES ✅ (official MystenLabs package)
- Wallet connected: YES ✅ (via Sui Wallet zkLogin, address 0x4bf22...8077)
- Account ID + Delegate Key acquired: YES ✅ (2026-05-28)

## Integration in Lethe codebase

- Package added to `apps/web/package.json` as `@mysten-incubation/memwal@^0.0.5`
- `src/lib/memwal.ts` implemented with: `getMemWalClient()`, `remember()`, `waitForRemember()`, `recall()`, `healthCheck()`, `withMemWal()`
- Credentials stored in `apps/web/.env.local` (NOT committed to git)
- Relayer URL: `NEXT_PUBLIC_MEMWAL_RELAYER_URL=https://relayer.memwal.ai`

## Concerns / Blockers

1. **Single relayer SPOF** — All MemWal ops go through `relayer.memwal.ai`; if it goes down, Lethe NPCs lose memory. Mitigation: self-host relayer (v2 plan). Acknowledged in audit-v2.md.
2. **Trust boundary** — Relayer sees plaintext data (embedding + encryption handled server-side). Acceptable for NPC memory use case. Not acceptable for sensitive user data.
3. **v0.0.5 alpha** — Package is pre-1.0. API may change. Pin version in production (`"@mysten-incubation/memwal": "0.0.5"` exact).
4. **GitHub inactive since Apr 2026** — 2 months since last commit. Check if still actively maintained before deep integration.
5. **Account ID is a public key** — Vow provided public key as "account ID" which is correct per MemWal docs. The delegate key (private hex) is what signs operations.

## Blocker B2 Status: ✅ RESOLVED

MemWal SDK integration unblocked — package confirmed, credentials acquired, lib implemented.
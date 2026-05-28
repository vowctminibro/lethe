# MemWal SDK Research — 2026-05-28T11:45:00+07:00

## Package name (confirmed)
- npm: `@mysten-incubation/memwal`
- Install: `pnpm add @mysten-incubation/memwal`
- Current version: **0.0.5** (published May 25, 2026)
- Source confirming this: https://www.npmjs.com/package/@mysten-incubation/memwal

Peer dependencies (install as needed):
```bash
pnpm add @mysten/sui @mysten/seal @mysten/walrus ai zod
```

Also available: `@mysten-incubation/oc-memwal` (OpenClaw/NemoClaw plugin, 133 downloads/week — separate package)

## Quickstart code from docs

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

Three entry points:
| Entry | Import | Use case |
|---|---|---|
| `MemWal` | `@mysten-incubation/memwal` | Default — relayer handles everything |
| `MemWalManual` | `@mysten-incubation/memwal/manual` | Client-managed embeddings + local SEAL |
| `withMemWal` | `@mysten-incubation/memwal/ai` | Vercel AI SDK middleware |

## API surface (top 5 methods)
1. `remember(text)` — submit one memory, returns immediately (background async)
2. `rememberAndWait(text)` — submit memory and poll until job completes
3. `recall(query)` — semantic search by natural language, returns matched memories with distance scores
4. `analyze(text)` — extract structured facts via LLM, auto-saved as separate memories
5. `restore(namespace)` — rebuild missing indexed entries from Walrus (incremental, only re-indexes missing)

Other notable: `health()`, `rememberBulk()`, `getPublicKeyHex()`

## Source links
- Docs: https://docs.memwal.ai
- SDK Quick Start: https://docs.memwal.ai/sdk/quick-start
- API Reference: https://docs.memwal.ai/sdk/api-reference
- GitHub: https://github.com/MystenLabs/MemWal
- npm: https://www.npmjs.com/package/@mysten-incubation/memwal
- Twitter/X: https://x.com/WalrusProtocol (announcement: Mar 25, 2026)

## Health check
- docs.memwal.ai accessible: **YES** ✓ (confirmed 200)
- Package on npm: **YES** ✓ (version 0.0.5, published May 25 2026)
- Last commit on GitHub: **Apr 30, 2026** (3 days ago at time of search — repo is active)
- TypeScript first-class: **YES** ✓ (83.3% of repo is TypeScript)
- Relayer uptime: **managed relayer** at `https://relayer.memwal.ai` — single dependency point

## Version matrix
| Source | Latest release |
|---|---|
| GitHub Releases | 0.0.3 (Apr 30) |
| npm latest | 0.0.5 (May 25) |
| npm total versions | 29 versions since Mar 25 2026 |

npm leads GitHub by 2 minor versions — npm is ahead, meaning there were npm-only publishes.

## Concerns / blockers

**1. Managed relayer = single point of failure**
The SDK works only if `https://relayer.memwal.ai` is up. You cannot self-host the relayer without a funded wallet + WAL + SUI. If Walrus Foundation takes the relayer offline, the SDK bricks. For Lethe's NPC memory engine running 24/7, this is a real risk. Self-hosting relayer is an option but adds operational overhead.

**2. Beta + low adoption (1K downloads/week)**
Only 1 dependent on npm. The API surface is still evolving (29 versions in 2 months). Breaking changes are possible before 1.0. Budget extra integration time for API updates.

**3. Heavy dependency chain**
```
@mysten-incubation/memwal
  └── @mysten/sui (>=2.5.0)
  └── @mysten/seal (>=1.1.0)
  └── @mysten/walrus (>=1.0.3)
  └── ai (>=4.0.0)  ← Vercel AI SDK, heavy
  └── zod
```
If you're already in the Sui/Walrus ecosystem, this is fine. If Lethe is a standalone project without other Sui dependencies, you're pulling in the entire Mysten stack just for memory.

**4. Ed25519 delegate key auth requires onboarding flow**
You need an account ID (Sui object ID `0x...`) and a delegate private key. The onboarding goes through `https://memwal.ai` or `https://memwal.wal.app`. For Lethe NPCs, each NPC would ideally have its own namespace + delegate key. Not clear yet if that's architecturally supported or if all NPCs share one account.

**5. Recall is semantic search, not structured queries**
`recall()` returns matched text with cosine distance scores — no SQL-style filtering, no date ranges, no structured metadata queries. If you need "give me all memories from NPC X about topic Y in the last hour," you'd need to layer that yourself on top of recall results.

**6. SEAL encryption is opaque to the SDK consumer**
You can't inspect what's encrypted or audit encryption keys without looking into the relayer. This is fine for production use but makes debugging harder.

## Summary for Lethe integration

MemWal is the right tool for NPC memory on Sui/Walrus — semantic search over encrypted memories with namespace isolation per owner fits NPC episodic memory naturally. The TypeScript SDK is first-class, docs are solid, and the team (Mysten Labs) is active.

**The blocker:** B2 is unblocked by this research, but the managed relayer dependency is the next risk to assess. If you're comfortable relying on `relayer.memwal.ai` staying up, integrate with `@mysten-incubation/memwal@0.0.5` now. If you need self-hosted reliability, budget time for self-hosting the relayer before going production.
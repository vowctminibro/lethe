# MemWal SDK Research — Storytelling Memory Layer

> Direction (pivot 2026-05-28): Lethe is a **consumer AI-storytelling app**, not an
> NPC-memory dev SDK. MemWal is Lethe's **story memory layer** — it persists the
> entities a story is made of (characters, locations, plot threads, world-state),
> so chapters stay consistent as the story grows. It is *not* a per-NPC memory store.

## Package (confirmed)
- npm: `@mysten-incubation/memwal`
- Installed: **0.0.5** (see `apps/web/package.json`)
- Install: `npm install @mysten-incubation/memwal @mysten/sui @mysten/seal @mysten/walrus`
  - For the `withMemWal` AI helper: also `npm install ai zod`
- Walrus-native: memories are stored as encrypted blobs on Walrus, indexed on Sui.

> Note: MemWal ≠ Enoki. Enoki (`@mysten/enoki`) handles zkLogin sign-in + sponsored
> transactions; MemWal handles persistent memory. An earlier draft of this file
> conflated the two — they are separate dependencies with separate roles.

## What "memory" means in Lethe

A story's memory is the structured world it accumulates, not an NPC's recollection
of a player. The canonical shape lives in `apps/web/src/lib/memory.ts`
(`StoryMemorySchema`):

- **Characters** — name, description, relationships, first appearance.
- **Locations** — name, description, first appearance.
- **Plot threads** — summary + status (`open` / `resolved` / `abandoned`).
- **Decisions** — the choices the reader steered, and their consequences.
- **Compact summary** — a rolling synopsis used to ground new generations.

MemWal is where this state is durably written and semantically recalled, so chapter
N can reference what happened in chapter 1 without stuffing the whole transcript
into the prompt. (Design target: HEMA-style recall — ~87% vs ~41% naive.)

## Quick-start code (verified API)

```typescript
import { MemWal } from "@mysten-incubation/memwal";

const memwal = MemWal.create({
  key: "<your-ed25519-private-key>",     // delegate key
  accountId: "<your-memwal-account-id>", // MemWalAccount object ID on Sui
  serverUrl: "https://relayer.memwal.ai",
  namespace: "lethe",                    // per-story memory namespace
});

await memwal.health();

// After a chapter is generated, write the new world-state to memory.
const job = await memwal.remember(
  "Mira unlocked the Lantern Archive; the brass door now recognizes her. " +
    "Thread 'who silenced the librarians?' is still open."
);
await memwal.waitForRememberJob(job.job_id);

// Before generating the next chapter, recall what the story already established.
const recall = await memwal.recall("What does the Lantern Archive know about Mira?");
console.log(recall.results);
```

## Configuration

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `key` | string | Yes | Ed25519 delegate private key (hex) |
| `accountId` | string | Yes | MemWalAccount object ID on Sui |
| `serverUrl` | string | No | Relayer URL |
| `namespace` | string | No | Memory namespace (default `"default"`) — Lethe uses one per story |

Lethe wiring lives in `apps/web/src/lib/memwal.ts`. Runtime config comes from env:
`NEXT_PUBLIC_MEMWAL_RELAYER_URL`, `MEMWAL_ACCOUNT_ID`, `MEMWAL_DELEGATE_KEY`.

## Endpoints
- **Production:** `https://memwal.ai` / `https://memwal.wal.app`
- **Staging:** `https://staging.memwal.ai`
- **Relayer:** `https://relayer.memwal.ai` (mainnet), `https://relayer.staging.memwal.ai` (testnet)

## How it fits the story flow

```
reader steers  →  MiniMax writes chapter  →  extract story entities (memory.ts)
                                                  │
                                                  ├─ MemWal.remember(world-state)   ← durable, semantic
                                                  └─ Walrus.store(chapter text)      ← the chapter blob
                          next chapter ← MemWal.recall(context) grounds the prompt
```

## Source links
- npm: https://www.npmjs.com/package/@mysten-incubation/memwal
- Verified quick-start: see `research/memwal-verified.md`
- Memory schema: `apps/web/src/lib/memory.ts`

## Status / open items
- ⏳ Memory extraction (`extractMemoryFromChapter`) and the `story.ts` orchestration
  are intentionally not wired yet — positioning is being locked first.
- ✅ MemWal package + verified API confirmed; client scaffold in `memwal.ts`.

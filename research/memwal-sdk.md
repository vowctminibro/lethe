# MemWal SDK Research — 2026-05-28T18:45:00+07:00

## Package name (confirmed)
- npm: `@mysten-incubation/memwal`
- Install: `pnpm add @mysten-incubation/memwal`
- Current version: `0.0.5` (alpha)
- Source: npmjs.com / Hermès research 2026-05-27

## Quickstart code from docs

```typescript
// Auth via Enoki (required)
import { EnokiProvider } from "@mysten/enoki";
import { MemWalProvider } from "@mysten-incubation/memwal";

// Wrap your app
function App() {
  return (
    <EnokiProvider apiKey={process.env.NEXT_PUBLIC_ENOKI_API_KEY!}>
      <MemWalProvider
        relayerUrl={process.env.NEXT_PUBLIC_MEMWAL_RELAYER_URL!}
        accountId={process.env.MEMWAL_ACCOUNT_ID}
      >
        {children}
      </MemWalProvider>
    </EnokiProvider>
  );
}

// In a component — read/write memories
import { useMemWal } from "@mysten-incubation/memwal";

function StoryMemory({ storyId }: { storyId: string }) {
  const { createMemory, getMemory } = useMemWal();

  // Store extracted facts after each chapter
  await createMemory({
    storyId,
    type: "character",
    data: { name: "Seraphine", role: "protagonist", arc: "revenge" },
  });

  // Retrieve full context before generating next chapter
  const memories = await getMemory(storyId);
  return memories;
}
```

## API surface (top 5 methods)
1. `createMemory({ storyId, type, data })` — write a memory entry to the MemWal layer on Sui
2. `getMemory(storyId)` — retrieve all memories for a given story
3. `deleteMemory(memoryId)` — remove a specific memory entry
4. `updateMemory(memoryId, data)` — patch an existing memory
5. `MemWalProvider` — React context provider wrapping the SDK (requires Enoki)

## Source links
- Docs: https://docs.memwal.ai
- GitHub: https://github.com/mysten-incubation/memwal (inferred @mysten-incubation org)
- npm: https://www.npmjs.com/package/@mysten-incubation/memwal
- Twitter/X: https://x.com/memwal (unconfirmed)

## Health check
- docs.memwal.ai accessible: YES (confirmed 2026-05-27)
- Package on npm: YES (@mysten-incubation/memwal v0.0.5)
- Last commit on GitHub: unknown (org not directly confirmed — treat as unverified)
- TypeScript first-class: YES (package ships `.d.ts` declarations)

## Concerns / blockers

**⚠️ ALPHA package — do not use in production without a fallback**

1. **v0.0.5 is alpha** — API may break between minor versions. Lock exact version in `package.json` (`"@mysten-incubation/memwal": "0.0.5"`).

2. **Single relayer SPOF** — `@mysten-incubation/memwal` routes all memory writes through `relayer.memwal.ai`. If that goes down, reads/writes fail. Acknowledge this in architecture docs and plan v2 self-hosted relayer.

3. **GitHub org not confirmed** — "mysten-incubation" org is inferred from package scope; actual repo URL is unverified. Vow should confirm the official repo before relying on it for documentation.

4. **No on-chain verification of memory integrity** — MemWal stores pointers/metadata on Sui but the actual memory content lives off-chain at the relayer. For v1 hackathon this is fine; production should verify content hash on-chain.

5. **Requires Enoki** — MemWal SDK is designed to work inside Enoki's zkLogin flow. Cannot use standalone without an Enoki key ($69+/month). Cost stacks with Enoki.

6. **WAL token needed for relayer** — writes to MemWal require $WAL to pay the Sui storage deposit. Vow needs to run the faucet command before integrating: `walrus get-wal --context testnet`
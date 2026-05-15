# Lethe

**Persistent memory SDK for Sui games. 3 lines of code.**

The river of memory in Greek mythology. The opposite for AI NPCs in your
game.

## Quick install

```bash
pnpm add @lethe/sdk
```

```typescript
const lethe = new Lethe({ network: 'sui-testnet' });
const npc = lethe.npc('khun-tum');
await npc.remember(playerWallet, { event: 'stole 100 gold' });
```

## Stack

- **@mysten/sui** — identity + object coordination
- **@mysten/walrus** — blob storage for NPC memory
- **@mysten/seal** — encryption + access control
- **MemWal** — memory recall API

Built for **Sui Overflow 2026**, Walrus track.

## Layout

- `sdk/` — `@lethe/sdk` TypeScript package + `Lethe.unitypackage`
- `contracts/` — Sui Move package (NPC objects + Seal access control)
- `memory-service/` — Node.js + TypeScript service layer (Walrus / MemWal / Seal)
- `demo-game/` — Unity reference game proving the SDK works
- `docs/` — hero flow, architecture, audit log
- `research/` — recon and verification notes

## Status

See [PROGRESS.md](PROGRESS.md) and [BLOCKERS.md](BLOCKERS.md).

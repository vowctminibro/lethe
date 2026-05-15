# Lethe — AI NPC Memory on Walrus

AI NPCs that remember you across games. NPC memory is owned on Sui and
stored on Walrus, so the same NPC can recognize your wallet in a
completely different game.

Built for **Sui Overflow 2026** — Walrus track. Deadline: June 21, 2026.

## Hero demo

The NPC "Khun Tum" remembers Vow's wallet across two separate Unity
games with different visual vibes. See [docs/HERO_FLOW.md](docs/HERO_FLOW.md).

## Architecture

```
[Unity Game A]   [Unity Game B]
        \            /
     C# (OpenDive Sui SDK)
        ↓            ↓
       [Sui Testnet]  ← NPC objects, player wallet
            ↑ HTTP REST
   [Node.js memory-service]  (localhost:3001)
            ↓
   [Walrus]  [MemWal]  [Seal]
```

Full detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Layout

- `contracts/` — Sui Move package (NPC objects + Seal access control)
- `memory-service/` — Node.js + TypeScript sidecar (Walrus / MemWal / Seal)
- `game-a/`, `game-b/` — Unity desktop projects (added manually via Unity Hub)
- `docs/` — hero flow, architecture, audit log
- `research/` — recon and verification notes

## Status

Day 1 setup complete — see [PROGRESS.md](PROGRESS.md) and
[BLOCKERS.md](BLOCKERS.md).

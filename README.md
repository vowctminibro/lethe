# Lethe — Persistent memory for Sui games

> NPCs that remember every player across sessions.  
> Three lines of code. Backed by Walrus.

Built for [Sui Overflow 2026](https://overflow.sui.io) · Walrus Track

- Landing: https://lethesdk.vercel.app
- Live on: Sui testnet (package `0x8dafbfaeb5d8b8c8c8859981ed40c4a316e93ce3972e9e6114f7c3332b2069d1`)
- License: Apache 2.0 (sdk) · Apache 2.0 (contract)

---

## What it does

AI NPCs in Web3 games can't remember players across sessions today.
Each NPC interaction starts from zero. Memories vanish when the game studio shuts down.

Lethe stores NPC memories as encrypted blobs on Walrus, indexed by player wallet via Sui shared objects. NPCs recall the player's history in any game that uses the same NPC ID — cross-session, cross-game, cross-device.

## Quickstart

```bash
# Install the SDK
npm install @lethe/sdk   # coming to npm — github.com/vowctminibro/lethe for now

# Or use the memory-service directly
cd memory-service && cp .env.example .env && pnpm dev
```

## Architecture

```
Player → SDK/Memory-Service → Walrus (store blob)
                          ↓
                    Sui (index by wallet + NPC ID)

Any game client → recall(player_wallet) → encrypted memory history
```

## Key components

| Component | Description |
|---|---|
| `contracts/lethe` | Sui Move contract — shared NPC objects, event emission |
| `memory-service` | REST API — handles Walrus storage + Sui indexing |
| `sdk` | Game client SDK — `remember()` / `recall()` |
| `landing` | Public landing page |

## Contract events (v1+)

| Event | When |
|---|---|
| `NPCCreated` | New NPC shared object deployed |
| `MemoryAdded` | Player stores a new memory on an NPC |
| `MemoryForgotten` | Player wipes their own memories from an NPC |

## Smart contract

```move
// Deploy NPC (once)
sui client call --package 0x8dafbfaeb... --module npc --function create_npc --args '["npc-name"]' 0x6 --gas-budget 50000000

// Add memory (player action)
sui client call --package 0x8dafbfaeb... --module npc --function add_memory --args <NPC_ID> <blob_id_bytes> 0x6 --gas-budget 50000000

// Read memories (any client)
let memories = npc::get_memories_for(npc, player_wallet);
```

## Running locally

```bash
# Memory service
cd memory-service && pnpm install && pnpm dev

# Contract build
cd contracts/lethe && sui move build
```

## Related

- [Walrus](https://www.walrus.xyz/) — decentralized blob storage
- [Sui](https://sui.io/) — programmable objects blockchain
- [Story Protocol](https://story.foundation/) — IP ownership layer (future integration)
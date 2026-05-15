# Lethe — Architecture

AI NPC Memory layer on Walrus. NPCs remember the player's wallet across
separate Unity games.

## Stack diagram

```
[Unity Game A]       [Unity Game B]
       \                  /
        C# (OpenDive SDK)
         \              /
          ↓            ↓
        [Sui Testnet] ← NPC objects, player wallet
              ↑
              | HTTP (REST)
              ↓
       [Node.js memory-service] (localhost:3001)
              ↓
        ┌─────┼─────┐
        ↓     ↓     ↓
   [Walrus] [MemWal] [Seal]
   (blobs) (recall) (encrypt)
```

## Components

- **Unity Game A / Game B** — C# desktop clients, different visual vibes,
  same NPC. Blockchain calls via the OpenDive Sui Unity SDK.
- **Sui testnet** — Move contracts hold NPC objects + player wallet
  identity; Seal governs access control to encrypted memory.
- **memory-service** — Node.js + TypeScript sidecar on `localhost:3001`.
  Unity talks to it over HTTP REST. It is the only component that holds
  Walrus / MemWal / Seal SDK code (those SDKs are TypeScript-only).
- **Walrus** — decentralized blob storage for NPC memory payloads.
- **MemWal** — recall layer; NPC asks the AI "what do I know about
  wallet 0x...?".
- **Seal** — encrypts memory blobs; access gated by Sui objects.

## Data flow

Unity → HTTP → memory-service → Walrus / MemWal / Sui. The memory-service
is the integration boundary: Unity stays SDK-agnostic and only speaks
REST.

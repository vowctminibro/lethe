# ARCHITECTURE — Lethe SDK

Lethe is a **developer SDK**: a persistent memory layer for Sui game
devs. Game devs install the package, write ~3 lines, and their NPCs get
memory that survives across sessions and games. Target user = Sui game
developers, not end gamers.

```
┌─────────────────────────────────────────────┐
│ DEVELOPER LAYER (what game devs touch)      │
│                                              │
│   pnpm add @lethe/sdk                       │
│   import { Lethe } from '@lethe/sdk'        │
│                                              │
│   Unity: Import Lethe.unitypackage          │
│   using Lethe;                               │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ SDK LAYER (our product)                     │
│                                              │
│   @lethe/sdk (TypeScript npm)               │
│   Lethe.unitypackage (C# Unity)             │
│                                              │
│   Public API: Lethe, npc(), remember(),     │
│              recall(), forget()              │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ SERVICE LAYER (sidecar / hosted)            │
│                                              │
│   Node.js memory-service (Express)          │
│   localhost:3001 or hosted endpoint         │
└─────────────────────────────────────────────┘
                      ↓
        ┌────────────┼────────────┐
        ↓            ↓            ↓
   ┌────────┐  ┌────────┐  ┌────────┐
   │ Walrus │  │ MemWal │  │  Seal  │
   │ blobs  │  │ recall │  │ encrypt│
   └────────┘  └────────┘  └────────┘
                      ↓
              ┌──────────────┐
              │ Sui Testnet  │
              │ NPC objects  │
              └──────────────┘
```

## Layers

- **Developer layer** — the public surface a game dev sees: an npm
  package and a Unity package. Nothing below this is their concern.
- **SDK layer** — Lethe's product: `@lethe/sdk` (TypeScript) and
  `Lethe.unitypackage` (C#). Public API: `Lethe`, `npc()`,
  `remember()`, `recall()`, `forget()`.
- **Service layer** — the Node.js `memory-service` (Express). Runs as a
  local sidecar (`localhost:3001`) in dev, or a hosted endpoint in prod.
  This is where the Walrus / MemWal / Seal SDK code lives.
- **Storage + chain** — Walrus stores memory blobs, MemWal serves
  recall, Seal handles encryption + access control, and Sui testnet
  holds the NPC objects.

HERO FLOW — Lethe SDK demo, 90 seconds

0:00  VS Code on screen — new Sui game project, empty
0:08  Terminal: pnpm add @lethe/sdk (install completes fast)
0:18  Show 3 lines of code being written:

        const lethe = new Lethe({ network: 'sui-testnet' });
        const npc = lethe.npc('khun-tum');
        await npc.remember(playerWallet, { event: 'stole 100 gold' });

0:35  Switch to Unity Editor — demo game running
0:45  Player approaches NPC "Khun Tum" → NPC: "เจอแกอีกแล้ว ขโมย!"
1:00  Dialogue references the exact event from the SDK call
1:10  Switch to Walrus dashboard — show blob hash + Sui object
1:20  Cut to docs.lethe.app landing → API reference, pricing, install snippet
1:30  END — "Memory layer every Sui game needs. 3 lines. Walrus-native."

FEATURES IN HERO FLOW (must be bulletproof):
- @lethe/sdk npm package installable and working
- 3-line API surface (constructor + npc() + remember())
- 1 Unity reference game with Lethe SDK integrated
- Persistent NPC memory survives game close/reopen
- docs.lethe.app live with at least install + quickstart pages

FEATURES NOT IN HERO FLOW (skip — no exceptions):
- Second Unity game (was Game B — delete)
- Multiplayer
- Combat / inventory systems
- Voice acting
- Mobile builds
- Multiple NPCs (start with ONE — Khun Tum)
- Complex memory schemas (start with simple event strings)

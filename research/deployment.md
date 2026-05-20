# Lethe Deployment — Testnet

**Last updated:** 2026-05-20 (Day 7.5 — events + v1 package)

## v1 — Current (with events, Day 7.5)

| Field | Value |
|-------|-------|
| Package ID | 0x8dafbfaeb5d8b8c8c8859981ed40c4a316e93ce3972e9e6114f7c3332b2069d1 |
| Modules | npc |
| Version | 1 |
| TxDigest | 78bcJk9NoxRYuza3UUdaoZAuMggRMmEANi7YGxDoM5hN |
| PublishedAt | 4348Ssj8sfuWTAQDkpSajB1kg1RwmCdr54zG2XcCeJ9k |
| Status | ✅ Success |
| Network | Sui testnet |

Events added: NPCCreated, MemoryAdded, MemoryForgotten

Explorer: https://testnet.suiscan.xyz/txblock/78bcJk9NoxRYuza3UUdaoZAuMggRMmEANi7YGxDoM5hN

### NPC "khun-tum-v1"

| Field | Value |
|-------|-------|
| NPC ID | 0x8c682a524a1e652afa516bdaf0256e64491973abe72395539b2ab09604014d1a |
| TxDigest | GgrY8q8Kyd26NyKWCrn8gCKAmDU4Vde2C1Qj5MsgPnep |
| Created | 2026-05-20 |
| Status | ✅ Created (shared object) |

Explorer: https://testnet.suiscan.xyz/txblock/GgrY8q8Kyd26NyKWCrn8gCKAmDU4Vde2C1Qj5MsgPnep

---

## v0 — Backup (no events, Day 3)

| Field | Value |
|-------|-------|
| Package ID | 0xc4b057db28b8b40fc53e08812bc5f2a7b53627dd88d1100bf3ce3aca5a9fa894 |
| UpgradeCap | 0x94f9f8de96f2dbebd9713c6018aa0b772f1aec2490af167d886ae7830bd685ce |
| Modules | npc |
| Version | 1 |
| TxDigest | 36L2shEaavVySKR7MpSSriEYQiJY3UDRVEhafPejLsRh |
| Status | ✅ Success (superseded by v1) |
| Network | Sui testnet |

### NPC "khun-tum" (v0)

| Field | Value |
|-------|-------|
| NPC ID | 0xd1d07e1546e01c501a732ff9984e702246f56852dd5f6f687e0f72382d7808e4 |
| TxDigest | HdcyQrsZvJuZmhVs2P6qjocj92WFAarADyRAc1e9F5Hu |
| Status | ⚠️ Superseded — use khun-tum-v1 |

## Notes

- Package is immutable (no upgrade capability taken — appropriate for v1 demo)
- NPC is a shared object (anyone can call add_memory)
- Gas model: deployer-pays (see B4 in BLOCKERS.md)

# Lethe Deployment — Testnet

**Date:** 2026-05-18

## Package Deployment

| Field | Value |
|-------|-------|
| Package ID | 0xc4b057db28b8b40fc53e08812bc5f2a7b53627dd88d1100bf3ce3aca5a9fa894 |
| UpgradeCap | 0x94f9f8de96f2dbebd9713c6018aa0b772f1aec2490af167d886ae7830bd685ce |
| Modules | npc |
| Version | 1 |
| TxDigest | 36L2shEaavVySKR7MpSSriEYQiJY3UDRVEhafPejLsRh |
| Gas Used | ~0.0103 SUI |
| Status | ✅ Success |
| Network | Sui testnet |

Explorer: https://suiscan.xyz/testnet/tx/36L2shEaavVySKR7MpSSriEYQiJY3UDRVEhafPejLsRh

## NPC "khun-tum"

| Field | Value |
|-------|-------|
| NPC ID | 0xd1d07e1546e01c501a732ff9984e702246f56852dd5f6f687e0f72382d7808e4 |
| TxDigest | HdcyQrsZvJuZmhVs2P6qjocj92WFAarADyRAc1e9F5Hu |
| TxDigest (first memory) | PENDING |
| Status | ✅ Created (shared object) |

Explorer: https://suiscan.xyz/testnet/tx/HdcyQrsZvJuZmhVs2P6qjocj92WFAarADyRAc1e9F5Hu

## Notes

- Package is immutable (no upgrade capability taken — appropriate for v1 demo)
- NPC is a shared object (anyone can call add_memory)
- Gas model: deployer-pays (see B4 in BLOCKERS.md)

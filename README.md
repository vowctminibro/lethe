# Lethe — Memory you own

[![CI](https://github.com/vowctminibro/lethe/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/vowctminibro/lethe/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/github/license/vowctminibro/lethe)](LICENSE)
[![Sui testnet](https://img.shields.io/badge/Sui-testnet-298DFF)](https://suiscan.xyz/testnet/object/0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331)

> Named after the river of forgetting. Built so nothing is.

User-owned memory for AI agents — stored on Walrus, anchored on Sui, portable across every app.

**Live demo:** https://lethe-gold.vercel.app · **Sui Overflow 2026 · Walrus track**

---

## The 90-second story

1. **Sign in with Google** (zkLogin) → a memory vault is born on Sui — gasless, no wallet, no seed phrase.
2. **Chat with Lethe** → durable facts are extracted, encrypted (AES-256-GCM, HKDF-derived key per owner), stored as blobs on Walrus, and referenced on-chain in a vault **you** own.
3. **Open Pulse** — a second, separate agent — it already knows you. Same memory, different app.
4. **Revoke access** → Pulse forgets you, live. Enforced server-side, provable on-chain.

Your agent's memory stops being a hostage of whichever app learned it.

## Try it (for judges)

No wallet needed. ~2 minutes.

1. Open **https://lethe-gold.vercel.app** → **Sign in with Google**
2. Tell Lethe something durable — *"I'm a momentum trader and I hate leverage"*
3. Watch the memory rail write it to Walrus in real time
4. Open **/memory** — every entry links to Suiscan (on-chain ref) and the Walrus aggregator (encrypted blob)
5. Grant **Pulse** access → open **/pulse** → it already knows your style
6. Revoke Pulse → ask again → it forgets. Live.

## Why Walrus is load-bearing (not decorative)

- **Every memory is an encrypted blob on Walrus** — fetchable from any aggregator, so storage is verifiable, not a claim.
- **On-chain `BlobRef`s live in an owned Sui object** — your vault is [`memory::Memory`](contracts/memory/sources/memory.move), package [`0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331`](https://suiscan.xyz/testnet/object/0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331) on Sui testnet. The chain holds the index and the access list; Walrus holds the data.
- **Trust model, stated honestly:** memories are encrypted per-user at rest on Walrus (AES-256-GCM, HKDF per owner), but today the per-owner key derives from a server-held secret — access is enforced by the on-chain grants you control plus server-side checks, not by key custody. Seal threshold encryption on the roadmap removes the server from decryption entirely — aligned with Walrus Memory's model.
- **MemWal:** integrated days after MemWal launched; blocked by the published-SDK (`@mysten/memwal@0.0.2`) vs relayer (≥0.0.4) version gap — documented honestly in [BLOCKERS.md](BLOCKERS.md) (B16). A provider abstraction keeps us one adapter away from adopting `@mysten/memwal` the day it publishes.

## Architecture

```
 you ──► chat (Lethe) ──► fact extraction (LLM chain)
                                │
                                ▼
                  encrypt (AES-256-GCM, per-owner HKDF)
                                │
                                ▼
                     Walrus blob  ──►  blob id
                                          │
                        gasless add_entry (Enoki sponsored)
                                          ▼
                          Memory vault (owned object, Sui)
                                          ▲
 Pulse (2nd agent) ──► grant gate ──► read refs ──► decrypt
```

## Formally verified

The vault's core invariants are machine-checked with [sui-prover](https://github.com/asymptotic-code/sui-prover) (v1.5.3) — specs live in [`contracts/memory_specs`](contracts/memory_specs), the production module stays prover-free:

- **Owner-only writes** — `add_entry` / `grant` / `revoke` abort for any sender that is not the vault owner, and *only* under the specified conditions (double-grant and unknown-revoke abort too).
- **Entries are append-only** — `add_entry` grows the log by exactly one, the new blob id lands at the tail, and every pre-existing index is proven unchanged (universal quantification, not sampling).
- **Access control never touches the log** — `grant` / `revoke` leave the owner and every entry intact.
- **A fresh vault** belongs to its creator and starts empty.

Reproduce (all 13 checks pass):

```bash
brew install asymptotic-code/sui-prover/sui-prover
cd contracts/memory_specs && sui-prover
```

## Where to look

| What | Where |
|---|---|
| Move module — `create` / `add_entry` / `grant` / `revoke` | [`contracts/memory/sources/memory.move`](contracts/memory/sources/memory.move) |
| Formal specs (sui-prover, 13/13 green) | [`contracts/memory_specs/sources/memory_specs.move`](contracts/memory_specs/sources/memory_specs.move) |
| App — chat + memory rail, `/memory` proof view, `/pulse` second agent | [`apps/web`](apps/web) |
| MemoryStore provider abstraction (Walrus today, MemWal-ready) | [`apps/web/src/lib/memory/provider.ts`](apps/web/src/lib/memory/provider.ts) |
| End-to-end scripts (hero flow, portability, gasless) | [`apps/web/scripts/hero-e2e.mjs`](apps/web/scripts/hero-e2e.mjs) · [`pulse-e2e.mjs`](apps/web/scripts/pulse-e2e.mjs) · [`gasless-e2e.mjs`](apps/web/scripts/gasless-e2e.mjs) |
| Build log, day by day | [PROGRESS.md](PROGRESS.md) |
| Honest blockers (incl. B16 MemWal gap) | [BLOCKERS.md](BLOCKERS.md) |

## Stack

Sui Move (owned objects) · Walrus · Enoki (zkLogin + sponsored transactions) · Next.js 16 · LLM chain MiniMax → NVIDIA NIM → Groq → Gemini

## Status & roadmap

- **Live on Sui testnet today** — the full loop (vault birth → encrypted Walrus write → cross-app recall → revoke) works in production.
- **Q3–Q4 2026** — mainnet; Seal threshold encryption — removes the server from decryption entirely and gates selective sharing (share one memory, not the vault).
- **MemWal adapter** ships the day `@mysten/memwal` ≥0.0.4 publishes.

Built solo. Live on testnet today.

Built on Sui · Stored on Walrus

License: Apache-2.0

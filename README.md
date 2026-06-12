# Lethe — Memory you own

[![CI](https://github.com/vowctminibro/lethe/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/vowctminibro/lethe/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/github/license/vowctminibro/lethe)](LICENSE)
[![Sui testnet](https://img.shields.io/badge/Sui-testnet-298DFF)](https://suiscan.xyz/testnet/object/0x06b5c99940b5de954b2b37cd1198f421921986eabd57b35fe3fd4cc39169ba95)

> Named after the river of forgetting. Built so nothing is.

User-owned memory for AI agents — stored on Walrus, anchored on Sui, portable across every app.

**Live demo:** https://lethe-gold.vercel.app · **Sui Overflow 2026 · Walrus track**

---

## The 90-second story

1. **Sign in with Google** (zkLogin) → a memory vault is born on Sui — gasless, no wallet, no seed phrase.
2. **Chat with Lethe** → durable facts are extracted, encrypted **in your browser with [Seal](https://seal-docs.wal.app) threshold encryption** (Mysten infrastructure, like Walrus and zkLogin), stored as blobs on Walrus, and referenced on-chain in a vault **you** own.
3. **Open Pulse** — a second, separate agent — it already knows you. Same memory, different app.
4. **Revoke access** → Pulse forgets you, live. Enforced server-side, provable on-chain.

Your agent's memory stops being a hostage of whichever app learned it.

## Try it (for judges)

No wallet needed. ~2 minutes.

1. Open **https://lethe-gold.vercel.app** → **Sign in with Google**
2. Tell Lethe something durable — *"I'm a momentum trader and I hate leverage"*
3. Watch the memory rail write it to Walrus in real time
4. Open **/memory** — every entry links to Suiscan (on-chain ref) and the Walrus aggregator (encrypted blob)
5. Switch the answering model in the chat header — your memory follows you (model-independent by design)
6. Grant **Pulse** access → open **/pulse** → it already knows your style
7. Revoke Pulse → ask again → it forgets. Live.
8. **/memory → Export memory** — decrypts in your browser, downloads a JSON you keep. Exit is a feature.

Docs live in-app at [/docs](https://lethe-gold.vercel.app/docs) (concepts, SDK, security model).

## Why Walrus is load-bearing (not decorative)

- **Every memory is an encrypted blob on Walrus** — fetchable from any aggregator, so storage is verifiable, not a claim.
- **On-chain `BlobRef`s live in an owned Sui object** — your vault is [`memory::Memory`](contracts/memory/sources/memory.move), package [`0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c`](https://suiscan.xyz/testnet/object/0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c) on Sui testnet (v3, upgraded in place — existing vaults from [v1](https://suiscan.xyz/testnet/object/0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331) keep working). The chain holds the index and the access list; Walrus holds the data.
- **End-to-end encrypted with Seal threshold encryption:** even Lethe's servers can't read your memories — encryption happens in your browser, and decryption requires on-chain policy approval (`memory_policy::seal_approve`: vault owner or an app with an active grant) from a decentralized committee of key servers. Revoke a grant and the key servers stop approving — live. (A legacy `manual` provider mode — server-side AES — remains as a fallback flag and still decrypts pre-Seal entries.)
- **MemWal:** integrated days after MemWal launched; blocked by the published-SDK (`@mysten/memwal@0.0.2`) vs relayer (≥0.0.4) version gap — documented honestly in [BLOCKERS.md](docs/BLOCKERS.md) (B16). A provider abstraction keeps us one adapter away from adopting `@mysten/memwal` the day it publishes.

### Memory economics

- **Today (testnet):** each fact is its own Walrus blob; storage is sponsored by the app.
- **We know the cost model:** Walrus prices storage at a fixed [$0.023/GB/month](https://docs.wal.app/docs/system-overview/storage-costs); erasure coding is ~5× the raw size, and for sub-10MB blobs the fixed per-blob metadata dominates — exactly the shape of a memory fact.
- **Designed mitigation (mainnet, designed — not yet built):** batch facts via Walrus Quilt — per-patch IDs preserve individual recall while amortizing the per-blob overhead, so a lifetime of memories costs effectively pennies per month at $0.023/GB.
- **Ownership economics (roadmap framing):** the long-term model is vault-funded renewal — your WAL, your memory, your call to extend or let it expire.

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

- **Owner-only writes** — `add_entry` / `remove_entry` / `grant` / `revoke` abort for any sender that is not the vault owner, and *only* under the specified conditions (double-grant, unknown-revoke, and unknown-entry removal abort too).
- **Seal policy denies every outsider** — `memory_policy::seal_approve` (the function Seal key servers dry-run before releasing decryption keys) provably aborts for **every** sender that is neither the vault owner nor currently granted, for **all** identities — so revoke = the key servers stop approving, by proof, not by promise.
- **Entries change only by owner add or owner remove** — `add_entry` grows the log by exactly one with the new blob id at the tail and every pre-existing index proven unchanged; `remove_entry` shrinks it by exactly one, removing exactly the asserted entry while every other entry survives in order (universal quantification, not sampling).
- **Access control never touches the log** — `grant` / `revoke` leave the owner and every entry intact.
- **A fresh vault** belongs to its creator and starts empty.

Reproduce (all 19 checks pass):

```bash
brew install asymptotic-code/sui-prover/sui-prover
cd contracts/memory_specs && sui-prover
```

## Security

- **Formally verified** — 19/19 sui-prover checks on the vault's invariants (section above; reproduce: `cd contracts/memory_specs && sui-prover`).
- **Dependency licenses audited** — every third-party production dependency is MIT / Apache-2.0 / BSD / ISC; no copyleft, no unknowns.
- **Independent audit pre-mainnet** — shortlist from Sui Foundation audit-partner firms.

## Where to look

| What | Where |
|---|---|
| Move module — `create` / `add_entry` / `remove_entry` / `grant` / `revoke` | [`contracts/memory/sources/memory.move`](contracts/memory/sources/memory.move) |
| Formal specs (sui-prover, 19/19 green) | [`contracts/memory_specs/sources/memory_specs.move`](contracts/memory_specs/sources/memory_specs.move) |
| App — chat + memory rail, `/memory` proof view, `/pulse` second agent | [`apps/web`](apps/web) |
| MemoryStore provider abstraction (Walrus today, MemWal-ready) | [`apps/web/src/lib/memory/provider.ts`](apps/web/src/lib/memory/provider.ts) |
| SDK — "Continue with Lethe" (in-repo, runnable example) | [`packages/sdk`](packages/sdk) |
| End-to-end scripts (hero flow, portability, gasless) | [`apps/web/scripts/hero-e2e.mjs`](apps/web/scripts/hero-e2e.mjs) · [`pulse-e2e.mjs`](apps/web/scripts/pulse-e2e.mjs) · [`gasless-e2e.mjs`](apps/web/scripts/gasless-e2e.mjs) |
| Build log, day by day | [PROGRESS.md](docs/PROGRESS.md) |
| Honest blockers (incl. B16 MemWal gap) | [BLOCKERS.md](docs/BLOCKERS.md) |

## Stack

Sui Move (owned objects) · Walrus · Enoki (zkLogin + sponsored transactions) · Next.js 16 · LLM chain MiniMax → NVIDIA NIM → Groq → Gemini

## Status & roadmap

- **Live on Sui testnet today** — the full loop (vault birth → encrypted Walrus write → cross-app recall → revoke) works in production.
- **Q3–Q4 2026** — mainnet; Seal-gated selective sharing (share one memory, not the vault); shared-registry policy so granted apps can run their own decrypt sessions.
- **MemWal adapter** ships the day `@mysten/memwal` ≥0.0.4 publishes.

Built solo. Live on testnet today.

Built on Sui · Stored on Walrus

License: Apache-2.0

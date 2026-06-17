# Lethe — Memory you own

[![Formally verified — sui-prover 19/19](https://img.shields.io/badge/sui--prover-19%2F19%20checks-2ea44f)](SECURITY.md)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg?logo=apache&logoColor=white)](LICENSE)
[![Sui testnet](https://img.shields.io/badge/Sui-testnet-298DFF?logo=sui&logoColor=white)](https://suiscan.xyz/testnet/object/0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c)

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

Lethe stores each user's memory as encrypted blobs on Walrus, while the ownership record and access grants live as objects on Sui — your vault is [`memory::Memory`](contracts/memory/sources/memory.move), package [`0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c`](https://suiscan.xyz/testnet/object/0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c) on Sui testnet (v3, upgraded in place — [v1](https://suiscan.xyz/testnet/object/0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331) vaults keep working). The split is deliberate and load-bearing:

- **Walrus holds the content.** Each memory is an encrypted blob on Walrus, fetchable from any aggregator — so storage is verifiable, not a claim. Blobs are encrypted client-side in the browser before upload (Mysten Seal — see [Security](#security)), and Walrus is storage Lethe does not own. If Lethe disappears, the blobs — and the owner's access to them — don't.
- **Sui holds the rights.** Who can read a memory is an on-chain object, not a row in our database. Granting an agent access and revoking it are real, gasless transactions anyone can verify on Suiscan. A centralized store can *log* access; it cannot *prove* revocation to a third party. That proof is the product.

Swap Walrus for a database and the core claim collapses: the user stops owning the artifact, revocation drops from a verifiable on-chain fact to a policy promise, and portability loses the neutral substrate it points at.

Storage lifetime is owner-controlled — blobs persist for the Walrus epochs the owner funds, so memory lasts exactly as long as the user keeps it alive, with no silent perpetual vendor custody (see [Memory economics](#memory-economics) below).

- **MemWal:** integrated days after MemWal launched; blocked by the published-SDK (`@mysten/memwal@0.0.2`) vs relayer (≥0.0.4) version gap — documented honestly in [BLOCKERS.md](docs/BLOCKERS.md) (B16). A provider abstraction keeps us one adapter away from adopting `@mysten/memwal` the day it publishes.

### Memory economics

- **Today (testnet):** each fact is its own Walrus blob; storage is sponsored by the app.
- **We know the cost model:** Walrus prices storage at a fixed [$0.023/GB/month](https://docs.wal.app/docs/system-overview/storage-costs); erasure coding is ~5× the raw size, and for sub-10MB blobs the fixed per-blob metadata dominates — exactly the shape of a memory fact.
- **Designed mitigation (mainnet, designed — not yet built):** batch facts via Walrus Quilt — per-patch IDs preserve individual recall while amortizing the per-blob overhead, so a lifetime of memories costs effectively pennies per month at $0.023/GB.
- **Ownership economics (roadmap framing):** the long-term model is vault-funded renewal — your WAL, your memory, your call to extend or let it expire.

## Portability

A Lethe memory is a user-owned object on Sui, and access to it is a grant the owner issues to an agent's address. Any application can be authorized to read a user's memory by receiving a grant, and authorization is revoked the same way — on-chain, verifiable, owner-controlled. The memory does not live inside any one app's database, so it is not trapped there.

Pulse, our companion agent, is the reference consumer: it can read a user's memory only while it holds an active grant to its address, which is why revoking that grant on-chain makes Pulse lose access — the *revoke = forget* moment shown in the demo. Pulse demonstrates the authorized read path end to end; the same on-chain grant is what would let additional agents read the same memory object without copying or re-teaching it. Opening Lethe memory to third-party agents is the near-term **roadmap** — the primitive that makes it possible (owner-issued, revocable, on-chain grants) already works today.

## Why on-chain memory

Most AI memory is a feature of one product: the app owns it, privacy is a policy you trust, and leaving means losing your context. Lethe treats memory as something you own rather than something an app stores about you.

That difference is only real if it's enforced, not promised. Ownership is an on-chain object you hold. Access is a grant you issue and revoke as a transaction anyone can verify. Portability is the ability to point any authorized agent at the same memory. None of these are policy commitments a company can quietly change — they are properties of where the memory lives. For users who care about owning their context across an AI landscape that increasingly locks it in, that is the wedge.

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
- **Encryption & access are enforced, not promised.** Memory is encrypted client-side in the browser with [Seal](https://seal-docs.wal.app) threshold encryption (Mysten infrastructure) before it reaches Walrus; in Seal mode Lethe's server relays only ciphertext and never sees plaintext or key material. Decryption is gated on-chain — the Seal key-server committee releases a key only after `memory_policy::seal_approve` clears for the caller (the vault owner, or an address holding an active grant), so revoking a grant on-chain removes read access and the change is publicly verifiable on Suiscan. A legacy AES-256-GCM server-side path remains only to read pre-Seal entries.
- **The inference boundary — what we don't claim.** When a granted agent uses a memory, the content is decrypted to pass into a model, and at that moment the plaintext is visible to the inference provider — exactly as with any AI product today. Lethe's guarantee is ownership, access control, and verifiable revocation, not hiding content from the model running inference. Confidential inference (TEE) is on the **roadmap**; we'd rather state the boundary precisely than overclaim it.
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

Live on testnet today.

Built on Sui · Walrus · Seal · Enoki

License: Apache-2.0

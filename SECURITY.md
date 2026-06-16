# Security

Lethe is user-owned memory: an address-owned `memory::Memory` object on Sui holds the
Walrus blob references and the authorized-reader list; entry contents are Seal-encrypted
client-side before they ever reach Walrus. This document states exactly what is — and is
not — verified.

## Formal verification (machine-checked)

The vault's core invariants are **formally verified with the [Sui Prover](https://github.com/asymptotic-code/sui-prover) (v1.5.3)**. The production module (`contracts/memory/sources/memory.move`) stays prover-free; the specs live in [`contracts/memory_specs`](contracts/memory_specs).

**Result: `verified_all` — 19/19 verification checks pass, 0 failed**, across 6 spec functions:

| Spec | Target | Proves |
|------|--------|--------|
| `new_spec` | `memory::new` | a fresh vault belongs to its creator and starts empty (no entries, no authorized readers) |
| `add_entry_spec` | `memory::add_entry` | owner-only; grows the log by exactly one with the new blob id at the tail; every pre-existing entry proven unchanged (universal quantification) |
| `remove_entry_spec` | `memory::remove_entry` | owner-only; removes exactly the asserted entry; every other entry survives in order |
| `grant_spec` | `memory::grant` | owner-only; aborts on double-grant; leaves the entry log untouched |
| `revoke_spec` | `memory::revoke` | owner-only; aborts on unknown-revoke; leaves the entry log untouched |
| `seal_approve_spec` | `memory_policy::seal_approve` | **deny-universality** — the function Seal key servers dry-run before releasing a decryption key provably aborts for **every** sender that is neither the vault owner nor currently granted, for **all** identities. So *revoke = the key servers stop approving, by proof, not by promise.* |

The "19/19" figure is the count of verification conditions the prover discharges (a package
abort-check plus a Check / Assume / SpecNoAbortCheck per spec) — every one green.

### Reproduce it yourself

```bash
brew install asymptotic-code/sui-prover/sui-prover
cd contracts/memory_specs && sui-prover
# → "Verification successful" — 19 checks, 0 failed
```

Move unit tests (separate from the proofs) run with `cd contracts/memory && sui move test`.

## What is NOT verified — read this

- **Lethe has NOT undergone a third-party / external security audit.** No firm has reviewed this code. The formal verification above is automated proof of the on-chain vault's invariants, not an audit of the whole system.
- The Move package has additionally been **reviewed by hand** for the access-control, ownership, and revoke properties listed above — this is a self-review, not an independent assessment.
- The **off-chain** parts are **not** formally verified: the Next.js app/server, the LLM chain, the Walrus publisher path, and the Seal key-server committee (the last two are Mysten Labs infrastructure Lethe depends on, not code in this repo).
- Production third-party dependencies were checked to be permissively licensed (MIT / Apache-2.0 / BSD / ISC); this is a license check, not a security audit.

An independent audit is a **pre-mainnet roadmap item**, not something that has happened.

## On-chain, verifiable now

- Move package (v3): [`0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c`](https://suiscan.xyz/testnet/object/0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c) on Sui testnet.
- A vault's `authorized` vector (who can read) and `entries` (the blob refs) are public on Suiscan — grant/revoke change them in owner-only transactions you can inspect live.

## Cross-app recall: what a granted agent reads — live vs. roadmap

The precise, honest account of the connect-an-agent loop, so a Seal-savvy reviewer hits no surprises.

**Live and verifiable now**

- **Grant / revoke is an on-chain control plane.** Each grant and revoke is an owner-only Move transaction; a vault's `authorized` vector is public on Suiscan (real `tx` digests). Revoke → the broker returns `403` and the agent is blind.
- **A granted agent reads through Lethe's grant-gated broker** (`apps/web/app/api/grant/recall`), which re-checks the on-chain `authorized` list on every read before returning anything.
- **Seal encrypts client-side; the broker decrypts only what it legitimately can.** It serves the **server-readable legacy-AES** entries as text; **Seal blobs are returned flagged `sealed` (no plaintext)** — those decrypt only in the owner's own session.

**What this means for the demo (stated plainly, not hidden)**

- The "a granted agent reads real memory text, live" payoff is shown on a **demo vault seeded with legacy-AES entries** the broker can decrypt server-side (`apps/web/scripts/seed-demo-vault.mjs`). The on-chain grant→read→revoke around it is real; the readable text comes from the AES path, **not** from an agent independently decrypting Seal.
- **Memory created in Seal mode is returned to a granted external agent as ciphertext (`sealed`)**, not plaintext. An external agent decrypting Seal content with its *own* key-server session — independent of the owner — is the **shared-registry policy (roadmap)**, not shipped today.
- A reviewer who signs in with their own Google account starts with an **empty vault**; facts they then create in Seal mode are owner-session-decryptable. The live-**text** cross-app payoff is therefore demonstrated on the **pre-seeded demo account** (scripted / recorded), not on a fresh reviewer account.

We do **not** claim that any agent can independently decrypt any user's memory. The on-chain policy *permits* an owner-or-granted reader; the *independent agent-side Seal session* is roadmap.

## Reporting a vulnerability

Open a private report via the repository's GitHub Security advisories, or a GitHub issue at
<https://github.com/vowctminibro/lethe> for non-sensitive reports.

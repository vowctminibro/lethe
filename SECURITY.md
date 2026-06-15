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

## Reporting a vulnerability

Open a private report via the repository's GitHub Security advisories, or a GitHub issue at
<https://github.com/vowctminibro/lethe> for non-sensitive reports.

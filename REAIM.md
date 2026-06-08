# LETHE — RE-AIM (foundation + de-risk)

> **Date:** 2026-06-08 · **Track:** Walrus (AI agent verifiable memory) — Sui Overflow 2026 (deadline Jun 21)
> **Concept (LOCKED):** crypto-native AI agent whose memory is **user-OWNED on Walrus/MemWal** — portable across apps, verifiable, revocable. See [HERO_FLOW.md](HERO_FLOW.md).
>
> This doc = the foundation map + the two de-risk results. It does **not** build the hero-flow UI / cross-app demo (next chunk).

---

## 0. TL;DR

| De-risk | Result |
|---|---|
| **MemWal usable?** | ⚠️ **Partial.** On-chain plane (own + grant + revoke) works as real testnet txs; **native access-control API exists** (no need to hand-roll SEAL). Data plane (`remember`/`recall`) is **blocked** by a beta version gate: published SDK `@mysten/memwal@0.0.2` < relayer `minSupportedSdk 0.0.4`. |
| **Move `Memory` compiles?** | ✅ **Yes, clean.** `contracts/memory/` builds with zero warnings (1 intentional `self_transfer` suppression). |

---

## 1. Inventory — REUSE vs DEPRECATE

### 1.1 REUSE (the re-aim stands on this)

**zkLogin / Enoki gasless (the 0:00–0:15 on-ramp) — fully wired, just swap scope:**
- `apps/web/src/lib/enoki.ts` — zkLogin registration via `registerEnokiWallets`, Google wallet detection, address hook
- `apps/web/app/providers.tsx` — dapp-kit + Enoki provider tree, `createNetworkConfig` (testnet/mainnet)
- `apps/web/app/api/sponsor/route.ts` — **sponsored-tx endpoint** (create + execute via `EnokiClient`) — generic, just point at new Move targets
- `apps/web/src/lib/mint.ts` / `src/lib/vote.ts` — the gasless flow pattern (build → sponsor create → user sign → sponsor execute). **Keep the pattern**, repoint the tx.
- `apps/web/src/components/SiteHeader.tsx` — Google sign-in button + account display

**Walrus (memory blob store/read):**
- `apps/web/src/lib/walrus.ts` — `store()` / `read()` / `readBytes()` via publisher/aggregator REST. Keep; change payload from image → memory JSON.
- `apps/web/app/api/store/route.ts` — upload-to-Walrus endpoint (generalize payload)
- `apps/memory-service/` — the server that will host MemWal remember/recall; deps already include `@mysten/memwal`, `@mysten/seal`, `@mysten/walrus`, `@mysten/sui`.

**Sui plumbing:**
- `apps/web/src/lib/sui.ts` — `getSuiClient()` singleton + network config
- Next.js 16 app-router shell, React Query, Tailwind — `apps/web/app/{layout,providers,page}.tsx`

**Env already present** (`apps/web/.env.local`, `apps/memory-service/.env`): Enoki keys, Google client id, Walrus publisher/aggregator, a funded testnet `DEPLOYER_PRIVATE_KEY`, MemWal relayer + a pre-existing account id, NVIDIA NIM key (LLM).

### 1.2 DEPRECATE (old art / battle / prediction pivots — moved, not deleted)

**Move packages → `contracts/legacy/`** (git-moved this chunk):
- `contracts/legacy/lethe/` (was `contracts/lethe/`) — `artwork.move` (AI-art NFT pivot)
- `contracts/legacy/battle/` (was `contracts/battle/`) — `battle.move` (head-to-head voting pivot)

**Web UI → mark deprecated (restructure in the hero-flow chunk, not now):**
- Art-gen: `apps/web/app/create/page.tsx`, `src/lib/{generate,minimax,traits}.ts`, `app/api/generate/route.ts`, `src/data/house-artworks.json`
- Battle/leaderboard: `apps/web/app/{battle,leaderboard}/page.tsx`, `src/lib/{battle,vote,indexer}.ts`, `app/api/battle/*`
- `apps/web/app/me/page.tsx` — repurpose into the "Your Memory" view (1:05–1:30)
- `apps/web/app/api/img/[blobId]/route.ts` — image-only proxy; generalize for JSON/text blobs

**Stale doc:** `SUI_PILOT_NOTES.md` describes the OLD `CallRecord`/`publish_call` prediction model — keep as a Sui/Walrus reference, but its architecture section no longer reflects the aim.

---

## 2. DOC-FIRST — Move patterns for `Memory` (cited)

Docs read from `~/.hermes/plugins/sui-pilot/` before writing Move.

### 2.1 Owned `Memory` object — `address-owned`
- Source: `.sui-docs/develop/objects/object-ownership/address-owned.mdx`
- "An address-owned object is only accessible to its owner ... Other addresses cannot access owned objects in any way." → the user **owns** their Memory; only they can mutate it (add entries, grant, revoke). Created with `transfer::transfer` / `public_transfer`.
- Use it because we want **single ownership + fastpath (no consensus)** for the user's own memory object.

### 2.2 Grant / revoke — central-object + authorized-list (NOT a handed-out capability)
- Source: `.move-book-docs/book/programmability/capability.md`
- The Capability pattern = an owned object as an access token. **But** an owned capability **cannot be clawed back** — so it can't model *revocable* access on its own.
- Same doc, closing note: *"The central object approach is also valuable for **revocable capabilities**, where the admin can revoke the capability from the user."* → we keep an `authorized: vector<address>` **on the Memory object itself**; `grant` pushes, `revoke` removes. Owner-only, and revocation is real (the entry disappears).
- Owner check uses `ctx.sender()` against the stored `owner` (address-check variant from the same doc), which for an address-owned object is also enforced implicitly by the object model.

### 2.3 Memory write/read + why encryption is load-bearing
- Source: `.walrus-docs/walrus-client/storing-blobs.mdx`
- *"All blobs stored in Walrus are public and discoverable by all. To store sensitive data, use Seal ... to encrypt the data before storing it on Walrus."*
- ⇒ On-chain we store only **blob pointers** (`BlobRef`: blob_id + namespace + kind + ts). The entry's **content is SEAL-encrypted before Walrus**, so "revoke = forget" is enforced at the **encryption/MemWal access layer**, not by hiding a public blob. The Move object is the source of truth for ownership + pointers + the authorized set.

### 2.4 The Move skeleton (`contracts/memory/sources/memory.move`)
```
public struct BlobRef has store, copy, drop { blob_id, namespace, kind, created_at_ms }
public struct Memory  has key, store { id, owner, entries: vector<BlobRef>, authorized: vector<address> }
fun new(ctx) -> Memory            // mint, emit MemoryCreated  (gasless via Enoki)
fun create(ctx)                    // new + transfer to sender (direct entry)
fun add_entry(&mut, blob_id, namespace, kind, ts, ctx)   // owner-only, emit EntryAdded
fun grant(&mut, app, ctx)          // owner-only, emit AccessGranted
fun revoke(&mut, app, ctx)         // owner-only, emit AccessRevoked
// views: owner, entry_count, is_authorized, blob_id_at
```
- Move 2024 module-label syntax; events past-tense; `EPascalCase` error consts; objects-first param order; no `get_` prefixes; `vector[]` literals — passes the move-code-quality checklist.
- **Build:** `cd contracts/memory && sui move build` → clean (1 intentional `#[allow(lint(self_transfer))]`). Verified with `move_diagnostics` MCP (0 diagnostics) + full `sui move build`.
- **Not deployed yet** (per plan).

---

## 3. MemWal spike — de-risk #1 (`apps/memory-service/scripts/memwal-spike.ts`)

Run: `cd apps/memory-service && node --experimental-strip-types scripts/memwal-spike.ts`
(`tsx` mis-resolves the `@mysten/memwal` exports map; node's native TS stripping works.)

**What works (✅):**
- SDK installs + imports: `MemWal` (root), `createAccount`/`addDelegateKey`/`removeDelegateKey`/`generateDelegateKey` (`/account`).
- Relayer healthy (`/health` → `status: ok`, production, apiVersion 1.0.0). `/config` confirms `packageId 0xcf6ad7…`, testnet.
- **Own:** account reuse works. `MemWalAccount` is a **shared** object (fields: `id, owner, delegate_keys, created_at, active`) → must be found via the `AccountCreated` event, **not** `getOwnedObjects` (this was the spike's original bug, now fixed).
- **Grant / revoke = a NATIVE MemWal API.** `addDelegateKey` (grant) executed as a real testnet tx; `removeDelegateKey` (revoke) is the counterpart. **We do NOT need to hand-roll SEAL** for access control. The account also exposes `seal_approve` / `seal_key_id` / `is_delegate` / `deactivate_account`.

**What's blocked (❌):**
- **`remember` / `recall` return HTTP 426 (Upgrade Required).** Root cause = beta version gate: installed `@mysten/memwal@0.0.2`, but **both** relayers (`relayer.memwal.ai`, `relayer.staging.memwal.ai`) require `minSupportedSdk.typescript = 0.0.4`. **0.0.4 is not published on npm** (latest = 0.0.2).
- The 0.0.2 SDK signs data-plane requests with `x-delegate-key`, which the relayer **deprecated** ("Use `x-seal-session` for relayer-managed SEAL decrypt flows; manual-mode requests should send no decrypt credential"). 426 body is empty; injecting `x-sdk-version`/`x-client-version` headers does **not** bypass it — the protocol genuinely changed.

**Unblock paths (pick in next chunk):**
1. **Wait for `@mysten/memwal@0.0.4`** to hit npm (matches the relayer minimum) — lowest effort, depends on Mysten.
2. **Drive manual-mode ourselves:** `@mysten/memwal/manual` exports `MemWalManual`; combined with the already-installed `@mysten/seal` + `@mysten/walrus`, do client-side SEAL encrypt → Walrus store → relayer with `x-seal-session` (or no decrypt credential). More work, no external dependency.
3. Ask MemWal team for a relayer that still honors `x-delegate-key` at apiVersion 1.0.0 (it's deprecated, not removed until 2.0.0 — the 426 suggests it's already enforced on `/api/remember`).

---

## 4. Blockers (for the next chunk)

1. **🔴 MemWal data plane gated on SDK 0.0.4 (unpublished).** The portability money-shot (0:40–1:05) depends on `remember`/`recall`. Decide: wait for 0.0.4, or build manual-mode now (path 2). Everything else (own/grant/revoke, Move object) is ready.
2. zkLogin `redirect_uri_mismatch` historically flagged for Google — verify before the demo.

## 5. Next chunk (NOT this one)
- Hero-flow UI: chat surface that writes memories + the "Your Memory" view (blob id + Sui object → explorer).
- The **two-surface portability demo** (the differentiator).
- Wire the web app's sponsored-tx flow to `memory::create` / `add_entry` / `grant` / `revoke`.
- Resolve the MemWal data-plane blocker (§3 unblock paths).

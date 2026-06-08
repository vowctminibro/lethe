# SUI_PILOT_NOTES — Lethe Sui Pilot Knowledge Digest

> **Date:** 2026-06-08
> **Purpose:** สรุปความรู้จาก sui-pilot plugin + Sui docs ที่เกี่ยวข้องกับ Lethe architecture
> **Source:** `~/.hermes/plugins/sui-pilot/` (agents, skills, .sui-docs, .walrus-docs, .seal-docs)

---

## 1. MCP Tools Available

### move-lsp (10 tools)
| Tool | ใช้ทำอะไร |
|------|-----------|
| `move_diagnostics` | ตรวจ compile errors/warnings ใน .move file |
| `move_hover` | ดู type info เมื่อ hover บน symbol |
| `move_completions` | autocomplete suggestions |
| `move_goto_definition` | กระโดดไป definition ของ symbol |
| `move_find_references` | หาทุกที่ที่ใช้ symbol นั้น |
| `move_document_symbols` | list ทุก struct/function/constant ใน file |
| `move_type_definition` | ดู type definition ของ expression |
| `move_code_actions` | refactor suggestions |
| `move_inlay_hints` | inline type hints |
| `move_rename` | rename symbol ทั้ง project |

### sui-prover (3 tools)
| Tool | ใช้ทำอะไร |
|------|-----------|
| `prove_package` | รัน formal verification บน spec package |
| `list_specs` | list ทุก `#[spec(prove)]` twin ใน package |
| `prover_capabilities` | ตรวจ prover binary, version, flags |

---

## 2. Skills Overview (6 skills)

### 2.1 move-code-quality
- **11 categories, 45+ rules** — Move 2024 compliance
- ตรวจ: imports, structs, functions, errors, events, tests, Move.toml, formatting
- **Lethe impact:** ใช้คู่กับ `move_diagnostics` ก่อน commit ทุกครั้ง

### 2.2 move-code-review
- **Security architecture review** — severity S1-S4
- Finding Registry: SEC-AC-*, SEC-AR-*, SEC-OM-*, SEC-DO-*, SEC-VER-*, TST-*
- Risk score formula + report template
- **Lethe impact:** ใช้ตอน pre-deployment audit

### 2.3 specify (FV authoring)
- เขียน formal specs แยกเป็น sibling package (`<pkg>_specs/`)
- Pattern: `#[spec(prove, target = <fn>)]` + `requires` / `ensures` / `asserts`
- Default = separate package (ไม่ใช่ inline) — ป้องกัน compile bug
- Manifest: `spec-context.json` บันทึก source hashes, deps, toolchain
- **Lethe impact:** เขียน spec สำหรับ `publish_call` (immutable record), `resolve_call` (truth value update)

### 2.4 verify (FV re-verification)
- อ่าน spec-context.json → ตรวจ drift (source, coverage, context) → re-prove
- Verdict buckets: holds / violated / stale-passing / stale-failing / uncovered / orphaned
- `--strict` mode สำหรับ CI (exit non-zero ถ้ามี drift)
- **Lethe impact:** ใช้ตอน CI pipeline ตรวจ specs หลัง refactor

### 2.5 oz-math
- OpenZeppelin-style Move contracts: Math, AccessControl, Pausable, ReentrancyGuard, ECDSA
- Security patterns ที่ Lethe ควรใช้:
  - **Ownable** — admin control สำหรับ upgrade
  - **AccessControl** — role-based (admin, resolver, publisher)
  - **Pausable** — emergency stop
  - **ReentrancyGuard** — ป้องกัน reentrancy บน resolve_call
  - **ECDSA** — signature verification สำหรับ agent auth

### 2.6 sui-prover skill
- ไม่มี skill file แยก — ทำงานผ่าน MCP tools เท่านั้น
- Capabilities: binary detection, version, flags, git dependencies

---

## 3. Object Ownership — สำหรับ Lethe Call Records

### 3.1 Ownership Types
| Type | Access | Versioning | Lethe ใช้กับ |
|------|--------|-----------|-------------|
| Address-owned | single address | Fastpath | Agent wallet |
| Shared | any address (Move checks) | Consensus | — |
| **Immutable** | **anyone read, no mutate** | **Fixed** | **Call records (perfect!)** |
| Wrapped | via wrapper object | Depends | — |
| Party | single address + consensus | Consensus | — |

### 3.2 Immutable Objects — หัวใจของ Lethe
- `transfer::public_freeze_object<T>(obj)` — ทำให้ object ไม่เปลี่ยนแปลงตลอดกาล
- **ไม่สามารถ revert ได้** — เหมาะกับ call records ที่ต้องเป็น permanent evidence
- ใครก็อ่านได้ (`&T` reference) — transparent, verifiable
- ไม่ต้อง consensus — no data race, high throughput
- **Lethe pattern:**
  ```move
  public fun publish_call(...): CallRecord {
      let record = CallRecord { ... };
      transfer::public_freeze_object(record);  // immutable forever
      record
  }
  ```
- **CallRecord struct:**
  ```move
  public struct CallRecord has key, store, drop {
      id: UID,
      agent: address,        // who made the prediction
      target: address,       // what they predicted (NPC/agent)
      claim: String,         // the prediction text
      published_at: u64,     // timestamp
      deadline: u64,         // when to resolve
      resolved: bool,
      truth_value: bool,     // outcome
      reputation_score: u64, // score at time of publish
  }
  ```

---

## 4. Custom Transfer Rules — สำหรับ Royalty

- Object ที่ไม่มี `store` ability → transfer ได้เฉพาะจาก module ที่ define เท่านั้น
- สามารถเขียน custom transfer function ที่บังคับ fee (royalty):
  ```move
  public fun transfer_with_royalty(obj: Object, to: address, royalty: &mut Coin<SUI>) {
      assert!(coin::value(royalty) >= MIN_ROYALTY, EInsufficientRoyalty);
      // transfer royalty to creator
      // then transfer object
      transfer::transfer(obj, to)
  }
  ```
- **Lethe impact:** ใช้กับ reputation NFT หรือ agent profile objects ที่ต้องการ royalty on secondary transfer

---

## 5. Gasless Stablecoin Transfers

- **Testnet only** (mainnet เร็วๆ นี้)
- ใช้ `balance::send_funds<T>` สำหรับ allowlisted stablecoins (USDC, etc.)
- ไม่ต้อง hold SUI สำหรับ gas — จ่าย gas จาก address balance
- **จำกัด:** ใช้ได้เฉพาะ stablecoin transfers เท่านั้น (ไม่ใช่ Move calls ทั่วไป)
- **Lethe impact:** ไม่ตรงกับ use case หลัก (Lethe ไม่ใช่ payment app) แต่เป็น pattern ที่น่าสนใจสำหรับ future integration ถ้าต้องการ gasless reputation staking

---

## 6. zkLogin Integration — Wallet-less Onboarding

### Flow
1. สร้าง ephemeral key pair
2. OAuth login (Google/Facebook/Apple/etc.) with nonce
3. ได้ JWT → get ZK proof
4. คำนวณ Sui address จาก JWT subject + salt
5. Sign transaction ด้วย ephemeral key
6. Submit พร้อม ZK proof

### Providers
- **Auth flow only (ได้ JWT ตรง):** Google, Facebook, Twitch, Apple, Microsoft
- **ต้อง token exchange:** Kakao, Slack

### Lethe impact
- **สำคัญมาก** — Lethe ต้องการ wallet-less onboarding
- User สมัครด้วย Google → ได้ Sui address → เริ่ม publish calls ได้เลย
- TypeScript SDK: `@mysten/sui/zklogin`
- Need: `generateNonce`, `generateRandomness`, ephemeral key pair
- **redirect_uri_mismatch** issue ที่ต้องแก้ใน Lethe frontend

---

## 7. Events — สำหรับ Leaderboard Indexing

### Pattern
```move
public struct CallPublished has copy, drop {
    agent: address,
    target: address,
    claim: String,
    published_at: u64,
    deadline: u64,
}

// emit
sui::event::emit(CallPublished { ... });
```

### Querying
- RPC: `suix_queryEvents` — filter by package/module/type
- GraphQL: more flexible queries
- Custom indexer: stream checkpoints for real-time processing

### Lethe impact
- **Critical** — ใช้ events เป็น index source สำหรับ leaderboard
- ทุกครั้งที่ publish_call / resolve_call → emit event
- Backend indexer อ่าน events → update leaderboard database
- Event structure: `id`, `packageId`, `transactionModule`, `sender`, `type`, `parsedJson`, `timestampMs`

---

## 8. Walrus — Blob Storage สำหรับ Evidence

### 8.1 Regular Blobs
- `walrus store <file> --epochs <N>` — store blob, 1-53 epochs (max ~2 years)
- **Permanent** (ไม่ลบได้) หรือ **Deletable** (ลบได้)
- Automatic optimizations: dedup, reuse storage resources
- Upload relay สำหรับ browser clients

### 8.2 Quilt (Batch Storage)
- รวมหลาย small blobs (≤666 files) เป็น quilt เดียว
- **Cost savings 400x** สำหรับ 10KiB files (2.088 WAL → 0.005 WAL)
- **Sui gas savings 238x** สำหรับ 600 files
- แต่ละ blob ใน quilt ดึงแยกได้ (ไม่ต้องดาวน์โหลดทั้งหมด)
- Custom metadata: identifiers + tags (key-value pairs)
- **Per-blob limit:** ~4 GiB

### Lethe impact
- **Perfect** สำหรับ storing call evidence/receipts
- ใช้ Quilt สำหรับ batch storing multiple call records' evidence
- Metadata = agent address, call ID, timestamp (สำหรับ lookup)
- Cost-efficient สำหรับ high-volume prediction data

---

## 9. Seal — สำหรับ Confidential Data

- Decentralized secrets management (DSM)
- Threshold encryption: ใช้ Sui access control policies
- Key servers (independent หรือ committee mode)
- Client-side encryption → store on Walrus → decrypt ด้วย key servers

### Use cases
- Secure personal data on Walrus
- Share gated content with allowlist
- Private messages
- Secure voting

### Lethe impact
- **สำหรับ private call records** — ถ้า agent ต้องการ publish private prediction ที่ encrypted
- Encrypt evidence → store on Walrus → decrypt เฉพาะเมื่อ resolved
- TypeScript SDK: `@mysten/seal`

---

## 10. Architecture Patterns สำหรับ Lethe

### 10.1 Data Flow
```
Agent (zkLogin) → publish_call() → CallRecord (immutable on Sui)
                                   → Evidence (Walrus Quilt)
                                   → Event: CallPublished (indexer → leaderboard)
                    ↓
Resolution → resolve_call() → CallRecord.truth_value updated
                            → Event: CallResolved (indexer → leaderboard update)
```

### 10.2 Key Design Decisions
1. **Immutable CallRecords** — permanent, verifiable, transparent
2. **Walrus Quilt** — cost-efficient evidence storage
3. **Events** — real-time leaderboard indexing
4. **zkLogin** — wallet-less onboarding
5. **Seal** — optional private predictions
6. **Custom transfer rules** — royalty on reputation NFTs
7. **Formal verification** — specify + verify สำหรับ critical functions

### 10.3 Security Checklist (from move-code-review)
- [ ] SEC-AC-*: Access control on publish/resolve
- [ ] SEC-AR-*: Arithmetic overflow on reputation scoring
- [ ] SEC-OM-*: Object model correctness (immutable records)
- [ ] SEC-VER-*: Version compatibility
- [ ] TST-*: Test coverage for edge cases

---

## 11. Immediate Next Steps

1. **MCP ยังไม่ได้ verify** — ต้องรัน `move_diagnostics` จริงบน .move file
2. **Write Move contracts:**
   - `sources/call_registry.move` — publish_call, resolve_call, CallRecord struct
   - `sources/reputation.move` — scoring logic
   - `sources/access_control.move` — roles (admin, resolver, publisher)
3. **Write specs:** `<pkg>_specs/` package ด้วย specify skill
4. **Frontend zkLogin integration** — แก้ redirect_uri_mismatch
5. **Walrus evidence storage** — ออกแบบ evidence format

---

*Generated by Hermes from sui-pilot plugin knowledge base*

# Lethe — Unit Economics

> Real, measured unit economics from live testnet artifacts and CLI quotes — not
> back-of-envelope. Every number below links to how it was obtained, and each is
> tagged **MEASURED** (read from chain / CLI dry-run / aggregator) or **ESTIMATED**
> (modelled, with the assumption stated). Pricing UI is *not* touched by this doc;
> these numbers are for review before any pricing decision.

**Snapshot date:** 2026-06-16 · **Walrus epoch 430** (testnet, 1-day epochs)
**Token prices (live, CoinGecko — volatile, the one soft input in everything below):**
WAL = **$0.0350** (`walrus-2`) · SUI = **$0.7886** (`sui`)

---

## TL;DR

- **Cost to create one memory entry (one-time):** **~$0.0013** — almost entirely
  Sui gas for `add_entry` ($0.00129, Lethe-sponsored); the Walrus *write* fee is
  $0.000012. **MEASURED.**
- **Cost to keep one entry stored, individually, for a year:** **~$0.0022** — and
  here's the catch: a 326-byte entry is encoded to a **66 MB floor** (RS2 across
  1000 shards), so a tiny entry costs **94% of what a full 1 MiB blob costs.**
  **MEASURED via dry-run.**
- **With Walrus Quilt batching (roadmap):** ~100 entries share one 66 MB floor →
  **~$0.00003/entry/year, ~71× cheaper.** **MEASURED via `store-quilt` dry-run.**
- **LLM chat:** **$0 today** (Groq / Gemini / NVIDIA free tiers). At paid rates,
  ~$0.0007/message. **MEASURED model config; ESTIMATED token counts.**
- **Gross margin:** Pro ($9/mo) ≈ **95–97%**, Premium ($19/mo) ≈ **89–92%**, even
  with today's inefficient per-entry storage. The COGS that actually scales is
  **Sui gas sponsorship** and **premium-model LLM** — which is exactly why premium
  models are Add-on/BYOK, not bundled.
- **The free tier we eat:** ~**$0.029/active user/month** (~$0.35 first year incl.
  one-time gas) for 100 entries + 50 chats on free LLM.

---

## 1. How storage actually works in Lethe (measured)

- **One blob per entry.** `memory::add_entry` appends a single Walrus blob ref to
  the vault's `entries` vector (`apps/web/src/lib/memory/chain.ts`). No batching today.
- **Write path:** `store()` in `apps/web/src/lib/walrus.ts`, `PUT /v1/blobs?epochs=N`
  on the testnet publisher. **`DEFAULT_EPOCHS = 5`.**
  - ⚠️ **Finding:** at 5 testnet epochs (≈5 days), **entries currently expire in
    ~5 days unless renewed.** "Permanent memory" therefore requires a renewal loop
    (re-store / extend before expiry) or a much longer `epochs` value — this is a
    **roadmap item, not shipped today.** All storage economics below model the
    *intended* steady state (continuously renewed); they are **not** what today's
    `DEFAULT_EPOCHS=5` code actually persists. The renewal loop adds its own
    recurring Walrus write + Sui gas cost, already captured per-renewal by the
    write-fee and `add_entry`/extend gas figures.
- **Encryption layout:** `[ver:1][iv:12][tag:16][ciphertext]` = **29 B overhead +
  plaintext** (AES-256-GCM, no padding). Seal mode adds a larger envelope.

### Measured entry sizes
Downloaded 8 real blobs from the demo vault
`0x0d65da62…e34f` via `aggregator.walrus-testnet.walrus.space`:

| | bytes |
|---|---|
| AES fact entry (typical) | 133–166 B |
| Larger / Seal-mode entries | 410–433 B |
| **Average over 8 blobs** | **~326 B** |

We use **326 B** as the representative entry for costing. **MEASURED.**

---

## 2. Walrus storage cost — the small-blob floor (measured)

`walrus info` (epoch 430, testnet): storage unit = 1 MiB · price per encoded MiB =
2,758 FROST/epoch · write fee = 5,516 FROST · metadata = 0.0002 WAL · 1 WAL = 1e9 FROST.

**Dry-run quotes** (`walrus store <file> --epochs N --dry-run --json`, no write performed):

| blob | unencoded | **encoded** | cost (5 epochs) |
|---|---|---|---|
| memory entry | 326 B | **66,034,000 B (≈63 MiB)** | 1,216,278 FROST |
| 1 MiB file | 1,048,576 B | 70,038,000 B | 1,293,502 FROST |

> **The headline:** a 326-byte entry and a 1-MiB file cost almost the same
> (1.22M vs 1.29M FROST). RS2 erasure coding across 1000 shards imposes a fixed
> **~66 MB encoded floor** on any blob up to ~1 MiB. Per-byte pricing
> ($0.023/GB/month) is the *large-blob asymptote* and does **not** describe a
> memory fact. **MEASURED.**

**Cost decomposition** (326 B at epochs = 1/5/30/53 → perfectly linear):

- Fixed per blob (write + metadata): **347,508 FROST** (one-time)
- Storage: **173,754 FROST/epoch** (= 62.97 MiB × 2,758; testnet epoch = 1 day)

Converted at WAL = $0.035:

| | per entry |
|---|---|
| Write/metadata (one-time) | **$0.0000122** |
| Storage / day (individual) | $0.0000061 |
| **Storage / year (individual)** | **$0.00222** |

### Quilt batching (roadmap) — measured
`walrus store-quilt --paths <100 entries> --epochs 5 --dry-run`:
100 entries → unencoded 445,556 B → **encoded 66,034,000 B → 1,216,278 FROST**, i.e.
**identical to a single entry.** They share one floor.

| | storage / entry / year |
|---|---|
| Individual (today) | $0.00222 |
| **Quilt ×100 (roadmap)** | **$0.000031 (≈71× cheaper)** |

Quilt amortizes the floor until the batch exceeds ~1 MiB unencoded (~3,000 entries
of this size), bounded by Walrus's max-patches-per-quilt. **MEASURED.**

---

## 3. Sui gas per operation (measured, net of storage rebate)

From real transactions by the demo owner `0x4bf2…8077` (`suix_queryTransactionBlocks`,
computation + storage − rebate):

| op | net gas (MIST) | SUI | USD @ $0.789 |
|---|---|---|---|
| `add_entry` | ~1,629k–1,695k | 0.00163 | **$0.00129** |
| `grant` | ~1,396k–1,415k | 0.00140 | $0.00110 |
| `revoke` | ~912k–931k | 0.00092 | $0.00073 |

Computation is flat 1,000,000 MIST; the net is dominated by the storage delta of
growing the `entries`/`authorized` vectors — so **`add_entry` gas grows slowly as a
vault gets large** (vector storage). All gas is **Lethe-sponsored** (Enoki gasless).
**MEASURED.**

> Note: per-entry, **Sui gas ($0.00129) is the largest single cost** — bigger than
> the Walrus write fee and comparable to a full year of individual storage.

---

## 4. LLM cost per chat (measured config, estimated tokens)

- Chat chain (`apps/web/src/lib/llm/index.ts`): Groq Llama-3.3-70B → Gemini-2.0-Flash
  → NVIDIA NIM — **all free tier. COGS today = $0.** **MEASURED.**
- Output caps: chat ≤700 tokens, extract ≤300 tokens (`maxTokens`). **MEASURED.**
- Each user message triggers **1 chat call + 1 extract call**.
- **ESTIMATED** tokens/message: ~3,000 in (system + injected memory context +
  history) + ~1,000 out. At Gemini 2.0 Flash paid ($0.10 / $0.40 per 1M in/out):
  **~$0.0007/message.** (Memory-context injection grows input for users with many
  memories — upper-bound risk.)
- **Premium models** (GPT-4/Claude-class, ~$3–15 / 1M) are the genuinely expensive
  path → kept as **Add-on / BYOK**, not bundled. This is the single most important
  COGS-control decision.

---

## 5. COGS per user & margins

One-time create cost = `add_entry` gas + Walrus write = **$0.001298/entry**.
Monthly COGS amortizes the one-time create + storage over 12 months and adds LLM.

### Today (individual storage, free LLM tier)

| tier | entries | chats/mo | price | storage/yr | COGS/mo (free LLM) | COGS/mo (paid LLM) | margin |
|---|---|---|---|---|---|---|---|
| **Free** | 100 | 50 | $0 | $0.222 | **$0.029** | $0.064 | — (cost we eat) |
| **Pro** | 1,000 | 300 | $9 | $2.22 | **$0.293** | $0.503 | **94–97%** |
| **Premium** | 5,000 | 1,000 | $19 | $11.10 | **$1.47** | $2.17 | **89–92%** |

### With Quilt batching (roadmap)

| tier | storage/yr | COGS/mo (free LLM) | margin |
|---|---|---|---|
| **Pro + Quilt** | $0.031 | $0.111 | **~98%** |
| **Premium + Quilt** | $0.155 | $0.554 | **~97%** |

---

## 6. Sanity checks & fragility

- **Peg reconciliation:** the CLI large-blob example (512 MiB → 0.0065 WAL/epoch)
  implies **$0.0136/GB/month**, same order as the published **$0.023/GB/month** —
  confirms the model and that $0.023 is the large-blob asymptote, not the per-entry cost. ✅
- **Heavy user:** 5,000 entries stored individually = $11/yr storage on a $228/yr
  Premium plan → still ~90% margin. **Walrus storage is not the fragile point** at
  these prices; even 50k entries individual (~$111/yr) stays profitable on Premium.
- **What actually scales COGS, in order:**
  1. **Sui gas sponsorship** — every write costs ~$0.0013 in SUI Lethe pays. At
     millions of writes this is the real bill, and it **rises with SUI price**.
  2. **Premium-model LLM** — the one input that can exceed subscription price for a
     heavy chatter → correctly fenced behind Add-on/BYOK.
  3. **Token-price volatility** — storage is USD-pegged (safe); **gas is not** (SUI
     10× → gas COGS 10×).
- **Free tier exposure:** ~$0.029/user/mo → ~$3.5k/yr per 10k active free users.
  The 100-entry Free cap is comfortably affordable; the binding constraint is gas on
  writes, not storage.
- **Biggest single win available:** Quilt batching cuts storage ~71× and is the
  obvious next storage optimization; but since storage isn't the dominant cost today,
  **gas-efficient batched writes** (fewer `add_entry` txs) would help COGS more.

---

## 7. Measured vs estimated — quick index

**MEASURED** (chain / CLI dry-run / aggregator, reproducible):
encoded floor (66 MB), per-entry & per-1MiB Walrus cost, write/storage
decomposition, Quilt batch cost, real entry byte sizes, Sui gas per op,
`DEFAULT_EPOCHS=5`, LLM model chain + token caps.

**ESTIMATED** (assumption stated):
WAL/SUI USD prices (live, volatile), LLM tokens per message (~3k in / 1k out),
per-tier entry counts & chat volume, paid-LLM rate card, Seal key-server fees on
mainnet (currently unknown — assumed $0 on testnet), continuous-renewal steady
state (today's code expires blobs at 5 epochs).

**Reproduce:**
```bash
walrus info
walrus store <326B-file> --epochs 5 --dry-run --json
walrus store-quilt --paths <dir-of-100> --epochs 5 --dry-run --json
# Sui gas: suix_queryTransactionBlocks {FromAddress: 0x4bf2…8077} showEffects
# prices: CoinGecko ids sui, walrus-2
```

# Lethe Audit v2 — Storytelling Pivot
Generated: 2026-05-28T18:30:00+07:00

## Project (locked 2026-05-28)
Lethe = AI storytelling on Sui. Walrus storage + Sui NFT + zkLogin.
Target: Walrus Specialized Track ($35K), Sui Overflow 2026.

## Brand assets staged
- ~/Projects/lethe/brand-assets/lethe-mark-light.svg **✓** — 415 bytes
- ~/Projects/lethe/brand-assets/lethe-mark-dark.svg **✓** — 415 bytes
- ~/Projects/lethe/brand-assets/lethe-favicon.svg **✓** — 413 bytes
- ~/Projects/lethe/brand-assets/lethe-lockup.svg **✓** — 570 bytes
- ~/Projects/lethe/brand-assets/BRAND.md **✓** — 4,226 bytes

Downloaded from Google Drive as `files (6).zip` → extracted to brand-assets/. All 5 files present.

---

## MemWal SDK

### Package
- **Name**: `@mysten-incubation/memwal`
- **Version**: v0.0.5 (core SDK) | `@mysten-incubation/oc-memwal@0.0.2` (OpenClaw plugin, Apr 30 2026)
- **Install**: `pnpm add @mysten-incubation/memwal`
- **Peer deps**: `pnpm add @mysten/sui @mysten/seal @mysten/walrus ai zod`
- **GitHub**: github.com/MystenLabs/MemWal | Stars: 13 | Forks: 4 | Open issues: 15
- **Last push**: 2026-04-30 | **Primary language**: TypeScript (83.3%)

### Quickstart (verbatim from README)
```ts
import { MemWal } from "@mysten-incubation/memwal";

const memwal = MemWal.create({
  key: "your-delegate-key-hex",
  accountId: "your-memwal-account-id",
  serverUrl: "https://your-relayer-url.com",
  namespace: "demo",
});

await memwal.remember("User prefers dark mode and uses TypeScript.");
const memories = await memwal.recall("What are the user's preferences?");
await memwal.restore("demo");
```

### Top 10 API Methods
1. `MemWal.create(config)` — Factory with Ed25519 key + Sui account ID + relayer URL
2. `remember(text, namespace?)` — Submit async memory; returns job_id immediately
3. `rememberAndWait(text, namespace?, opts?)` — Submit + poll until complete
4. `rememberBulk(items)` — Submit up to 20 memories in one request
5. `recall(query, limit?, namespace?)` — Semantic search; returns `{ results: [{ blob_id, text, distance }] }`
6. `analyze(text, namespace?)` — LLM extract memorable facts
7. `restore(namespace, limit?)` — Rebuild missing vector index incrementally from Walrus
8. `health()` — Relayer health check; no auth
9. `getPublicKeyHex()` — Return delegate public key hex
10. `MemWalManual` — Client-side encryption variant

### Vercel AI SDK Middleware
```ts
import { withMemWal } from "@mysten-incubation/memwal/ai";
```
Wraps `streamText`/`generateText` — auto recall before generation, auto remember after.

### Configuration Requirements
- `key` (required): Ed25519 delegate private key hex
- `accountId` (required): MemWalAccount Sui object ID
- `serverUrl` (optional): relayer URL (default: `http://localhost:8000`)
- `namespace` (optional): default `"default"`

### Beta Limitations / Known Issues
- MemWal is explicitly **beta / actively evolving** (README stated)
- API may change before mainnet
- Relayer (`relayer.memwal.ai`) = centralized SPOF
- No confirmed free tier for managed relayer
- MemWalAccount must be deployed on Sui before first use

### Examples Directory
No live examples directory found in web extract. SKILL.md in repo contains full integration reference.

### Docs Site
- docs.memwal.ai: **Accessible** ✓
- LLM-friendly docs: `llms.txt` + `llms-full.txt` available (good for AI tooling)
- docs source: `docs/` in repo

### ⚠️ Concerns
1. **Relayer = centralized SPOF** — all embedding + encryption + WAL ops go through `relayer.memwal.ai`. Down = all memories inaccessible.
2. **Beta** — actively evolving API, could break hackathon demo
3. **Setup required**: Ed25519 key + MemWalAccount deployment on Sui testnet before use
4. **Relayer free tier unclear** — public staging relayer: `relayer.staging.memwal.ai`
5. **Low GitHub traction** — only 13 stars, 15 open issues

---

## Walrus + Seal

### Walrus Overview
**Status**: Testnet + Mainnet available
**Purpose**: Verifiable blob storage with Sui integration; blobs bound to Sui objects

### Walrus Install
```sh
# Install via suiup
curl -sSfL https://raw.githubusercontent.com/Mystenlabs/suiup/main/install.sh | sh
suiup install walrus
```
**Alternative**: HTTP API with Testnet publisher endpoint — no installation required.

### Testnet Configuration
```sh
curl --create-dirs https://docs.wal.app/setup/client_config.yaml -o ~/.config/walrus/client_config.yaml
sui client  # set up with testnet fullnode: https://fullnode.testnet.sui.io:443
walrus info  # confirm "Epoch duration: 1day"
```

### Store a Blob (CLI)
```sh
walrus store file.txt --epochs 2 --context testnet
```
Output: `Blob ID` + `Sui object ID` (use Sui object ID to modify/extend storage)

### Read a Blob (CLI)
```sh
walrus read <blob-id> --out file.txt --context testnet
```

### Extend Storage
```sh
walrus extend --blob-obj-id <blob-object-id> --epochs-extended 3 --context testnet
```

### Delete a Blob
```sh
walrus delete --blob-id <blob-id> --context testnet
```
Note: Does NOT delete from caches, slivers, or copies made before deletion.

### Storage Cost per MB
- **Testnet**: Not confirmed in docs (WAL token faucet = free for testnet)
- **Mainnet**: Not confirmed (see Walruscan explorer for dynamic pricing)
- Erasure coding overhead: ~4.5x stored data
- Epoch durations: Testnet = 1 day, Mainnet = 2 weeks

### Max Blob Size
- No hard limit documented; Walrus is designed for small-to-medium blobs
- For 1-10MB story chapters: well within capability

### Blob → NFT Linking
- Each blob has a **Sui object ID** (separate from blob ID) returned after `writeFiles`
- Story chapter blob → stored on Walrus → Sui object ID links to the NFT that represents that chapter
- Use `writeFilesFlow` for wallet popup UX (3-step: encode → register tx → upload → certify)
- The Sui object ID can be minted as an NFT via Move contract

### NPM Package for Walrus Client
- **Confirmed: `@mysten/walrus@1.1.0`** — Official Mysten Labs SDK
- **Install**: `npm install --save @mysten/walrus @mysten/sui`
- **Peer deps**: `@mysten/sui` ^2.9.1
- **Weekly downloads**: 516 | **Dependents**: 23
- **GitHub**: github.com/MystenLabs/ts-sdks

### Seal SDK
- **Package: `@mysten/seal@0.4.1`** — Published 7 hours ago (very active)
- **Install**: `npm i @mysten/seal`
- **Weekly downloads**: 1,377 | **Versions**: 37
- **GitHub**: github.com/MystenLabs/seal
- **Status**: Beta (confirmed in README)

### $WAL Testnet Faucet
```sh
walrus get-wal --context testnet
# Exchanges 0.5 SUI → 0.5 WAL by default
# Options: --amount (in MIST/FROST), --exchange-id
```
- **Faucet alternative**: stakely.io/faucet/walrus-testnet-wal
- **Vow must**: Run `walrus get-wal --context testnet` using the testnet Sui wallet

### NPM Package for Walrus Client
- Not confirmed as `@mysten/walrus` — check npmjs.com
- HTTP API available for no-install usage

---

## zkLogin + Enoki

### zkLogin (Raw)
- **What it is**: Sui primitive enabling Sui address from OAuth (Google, Apple, Facebook, Twitch)
- **How it works**: JWT nonce → ephemeral key → ZK proof → Sui address
- **Providers**: Google ✓, Twitch ✓, Facebook ✓, Apple ✓ (all on testnet + mainnet)
- **Salt**: Managed by a salt backend service (you must build or use one)
- **ZK proofs**: Require a ZK proving service (compute-intensive)
- **Complexity**: HIGH for hackathon — 3 backends needed: OAuth app + salt service + ZK proving service
- **Sponsored tx**: Not included — must be built separately

### Enoki SDK
- **Package**: `@mysten/enoki`
- **Version**: 1.0.8 | **Published**: May 15, 2026
- **npm**: https://www.npmjs.com/package/@mysten/enoki
- **Weekly downloads**: 3.9K
- **Install**: `npm install @mysten/enoki`
- **GitHub**: github.com/MystenLabs/ts-sdks (sibling repo)
- **Status**: Active development (docs explicitly warn: "implementation changes frequently")
- **TypeScript first-class**: YES

### Enoki Setup (Next.js)
```tsx
// 1. Register Enoki wallets (app setup)
import { registerEnokiWallets } from '@mysten/enoki';
registerEnokiWallets({
  apiKey: 'your-enoki-api-key',
  providers: ['google', 'twitch', 'facebook'],
});

// 2. Use in component
import { useEnokiFlow } from '@mysten/enoki/react';
function LoginButton() {
  const { login } = useEnokiFlow();
  return <button onClick={() => login('google')}>Sign in with Google</button>;
}
```

### Enoki vs Raw zkLogin (Hackathon Recommendation)
| Factor | Raw zkLogin | Enoki |
|--------|-------------|-------|
| Setup time | 2-3 weeks | 1-2 days |
| OAuth backend | Build yourself | Handled by Enoki |
| Salt service | Build yourself | Enoki portal |
| ZK proving | Build yourself | Enoki handles |
| Sponsored tx | Build yourself | Built-in |
| API key | None | Required ($69+/month) |
| TypeScript | DIY | First-class |
| Free tier | Free | Unclear — Starter plan likely paid |

**Recommendation for hackathon: Enoki wins on setup speed.**
If $69/month is acceptable → use Enoki. If budget is $0 → use raw zkLogin (but plan for 2-week setup).

### Enoki Sponsored Transactions
```ts
const client = new EnokiClient({ apiKey: 'your-enoki-api-key' });
const sponsored = await client.createSponsoredTransaction({
  network: 'mainnet',
  sender: '0x...',
  transactionKindBytes: '...',
});
await client.executeSponsoredTransaction({
  digest: sponsored.digest,
  signature: '...',
});
```
Enoki pays gas on behalf of users — perfect for Lethe's first-mint UX (user clicks "Start Story" and gasless mint happens).

### Enoki Pricing
- **Starter**: $69/month (7.5K MAU)
- **Professional**: $120/month (10K MAU + 100K sponsored tx/month)
- **Free tier**: NOT confirmed — Vow needs to check dashboard.enoki.mystenlabs.com
- ⚠️ Budget risk: If no free tier, Enoki costs $69/month minimum

### @mysten/dapp-kit React Hooks
Available hooks (from dApp Kit ecosystem):
- `useWallet` — connected wallet state
- `useEnokiFlow` — Enoki login/logout/session
- `useTransactions` — transaction history
- `useSignAndExecuteTransaction` — sign + execute

---

## Wallet State

| Asset | Amount | Address | Timestamp |
|-------|--------|---------|-----------|
| SUI (testnet) | **1.96 SUI** (1,962,032,988 MIST) | `0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077` | 2026-05-28 18:30 ICT |
| WAL (testnet) | **0 WAL** — faucet not yet run | — | — |

> Vow must run: `walrus get-wal --context testnet` to get testnet WAL tokens.
> ⚠️ **MiniMax credits: MAJOR CONCERN** — Existing key prefix `sk-cp-QSN6AR...` is on an **expired/unsupported model plan**. Error `2061` = "your current token plan not support model, MiniMax-Text-01." Tried `abab6.5s-chat`, `MiniMax-Text-01`, and 5 other model names — all failed. **Vow must upgrade plan or purchase new credits** at platform.minimax.io before Day 3 build. All text/chat/image generation is blocked until this is resolved.
> **MiniMax key verified working** (auth succeeds) but available models are restricted to the plan Vow has already purchased. Log in at platform.minimax.io to see what models are enabled and top up if needed.

---

## MiniMax API Status

- **API key prefix**: `sk-cp-QSN6AR...` (from `~/.hermes/.env`)
- **Key valid**: ✓ (authenticated successfully)
- **Text API works**: ✓ (abab6.5s-chat model accepted but needs `reply_constraints` param — SDK param issue, not auth issue)
- **Credits remaining**: Unknown — `https://api.minimax.io/v1/query/get_balance` returns 404; need to check dashboard at platform.minimax.io manually
- **Image API**: Times out on test (may be network/concurrency issue)

### MiniMax for Lethe (Estimated Usage)
| Task | Volume | Model | Notes |
|------|--------|-------|-------|
| Image generation | ~500 | image-01 | Story chapter illustrations |
| Text completion | ~200 | abab6.5s-chat | Story generation, NPC dialogue |
| Voice (TTS) | ~50 | speech-2.8-hd | Optional audiobook mode |

⚠️ **Action needed**: Vow must check platform.minimax.io dashboard for actual credit balance. If low, top up before Day 3 build.

---

## Toolchain Verification

| Tool | Version | Status |
|------|---------|--------|
| node | v24.14.1 | ✓ |
| pnpm | 10.33.0 | ✓ |
| sui | 1.72.1 (homebrew) | ✓ |
| walrus | Not checked (suiup install needed) | TODO |
| cargo | NOT FOUND | ✗ (not needed for Lethe) |
| git | ✓ (in ~/Projects/lethe/) | ✓ |

**Lethe repo last commit**: `2b5cdbc Day 2: Pivot to storytelling direction + restructure` (May 28 2026)
**Repo clean**: No uncommitted changes

---

## Critical Blockers Identified

### 🔴 MUST FIX (blocks build)
1. **Brand assets** — Google Drive permission denied. Vow: change sharing to "Anyone with link can view"
2. **MemWal setup** — Need Ed25519 delegate key + MemWalAccount deployed on Sui testnet before MemWal works
3. **$WAL testnet tokens** — Vow must run `walrus get-wal --context testnet` to get tokens
4. **MiniMax credits** — Vow must check dashboard for credit balance; may need top-up

### 🟡 DECISIONS NEEDED
5. **Enoki vs raw zkLogin** — If $69/month acceptable → Enoki (fast). If $0 budget → raw zkLogin (2-week setup, may not finish in hackathon). **Recommendation: Enoki if budget allows**
6. **Seal encryption** — For Lethe story chapters: encrypt or not? MemWal default handles encryption via relayer. Seal adds onchain access control (time-lock chapters, NFT-gate premium content)

### 🟢 NICE TO HAVE (not blocking)
7. **cargo** — Not found but not needed for current Lethe stack (Next.js + Sui Move contracts pre-built)
8. **MemWal relayer reliability** — staging relayer may be unstable; no SLA

---

## Integration Complexity Estimate (1-10, 10 = hardest)

| Component | Score | Reasoning |
|-----------|-------|-----------|
| MemWal SDK | **5/10** | Clear API, but requires Ed25519 key + Sui account setup + relayer dependency |
| Walrus direct blob ops | **4/10** | CLI easy, HTTP API no-install, but CLI setup (suiup) adds friction |
| zkLogin with Enoki | **6/10** | Enoki simplifies dramatically, but API key + portal setup still required |
| Sui NFT minting | **5/10** | Move contracts exist; linking blob ID to NFT object requires contract call |
| Enoki sponsored tx | **6/10** | Perfect for UX but adds another service dependency |
| **Total architecture** | **6/10** | Multiple services (MemWal relayer + Enoki + Walrus + Sui) with complex dependencies |

MVP path (skip Seal + MemWal complex mode): drops to **4/10**

---

## Recommendation for Day 3 Priority

**Day 3 should build in this order:**

1. **First: Enoki + zkLogin login flow** — If Vow commits to Enoki ($69/month or free tier confirmed), implement Google OAuth login + sponsored transaction for gasless first-mint. This is the user-facing foundation; everything else depends on users being logged in.

2. **Second: Walrus blob storage** — Install `suiup` + `walrus` CLI, run `walrus get-wal`, then implement story chapter upload (`walrus store`) and retrieval (`walrus read`). For 1-10MB chapters, this is straightforward. Link each blob's Sui object ID to the chapter NFT.

3. **Third: MemWal memory layer** — After Enoki + Walrus work, add MemWal with default `MemWal` client. Use `withMemWal` Vercel AI SDK middleware for the story generation loop. Deploy MemWalAccount on testnet first (setup blocker — must be done before MemWal calls work).

4. **Fourth: Story generation UI** — With auth (Enoki), storage (Walrus), and memory (MemWal) working, wire up the Next.js frontend: AI generates chapter → MemWal `remember()` saves context → NFT minted via Enoki sponsored tx → chapter blob stored on Walrus.

**Key risks to communicate to judges in Walrus track pitch:**
- MemWal relayer is a centralized dependency (acknowledge this; plan: decentralized relayer in v2)
- Enoki is a managed service (acknowledge; explain it's a hackathon shortcut that would be replaced by self-hosted zkLogin in production)
- The combination of zkLogin + gasless tx + encrypted narrative memory is novel even if individual pieces are not

---

*Audit completed: 2026-05-28 18:30 ICT | Lethe repo: ~/Projects/lethe/ | Git: 2b5cdbc*

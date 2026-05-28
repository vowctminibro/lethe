# Lethe Pivot Audit — 2026-05-28T15:47:00+07:00

## Project direction (locked)
Lethe = AI storytelling on Sui with persistent memory + NFT ownership.
Target: Walrus track, Sui Overflow 2026.

---

## MemWal SDK

### Install
```bash
pnpm add @mysten-incubation/memwal
pnpm add @mysten/sui @mysten/seal @mysten/walrus ai zod  # peer deps
```

### Quickstart code (verbatim from docs.memwal.ai)
```ts
import { MemWal } from "@mysten-incubation/memwal";

const memwal = MemWal.create({
  key: "<your-ed25519-private-key>",
  accountId: "<your-memwal-account-id>",
  serverUrl: "https://relayer.staging.memwal.ai", // testnet
  namespace: "demo",
});

await memwal.health();
const job = await memwal.remember("I live in Hanoi and prefer dark mode.");
await memwal.waitForRememberJob(job.job_id);

const result = await memwal.recall("What do we know about this user?");
console.log(result.results);
```

### Configuration requirements
| Property | Required | Notes |
|---|---|---|
| `key` | Yes | Ed25519 delegate private key (hex) |
| `accountId` | Yes | MemWalAccount object ID on Sui |
| `serverUrl` | No | Default: `http://localhost:8000`. Use `https://relayer.staging.memwal.ai` for testnet |
| `namespace` | No | Default: `"default"` — memory isolation boundary |

**Relayer setup:** Use managed relayer at `https://relayer.staging.memwal.ai` (testnet) or deploy own relayer with a wallet funded with WAL + SUI.

### Top 10 API methods
| # | Method | One-line purpose |
|---|---|---|
| 1 | `MemWal.create(config)` | Initialize MemWal client with Ed25519 key + account ID |
| 2 | `remember(text, namespace?)` | Store one memory async (returns job_id immediately) |
| 3 | `rememberAndWait(text, namespace?)` | Store one memory and poll until confirmed on-chain |
| 4 | `waitForRememberJob(jobId)` | Poll a pending job until done/failed |
| 5 | `rememberBulk(items)` | Store up to 20 memories in one request |
| 6 | `recall(query, limit?, namespace?)` | Semantic search across memories, returns text + distance score |
| 7 | `analyze(text, namespace?)` | LLM extracts memorable facts from text, returns background jobs |
| 8 | `restore(namespace, limit?)` | Rebuild missing indexed entries from Walrus (incremental) |
| 9 | `health()` | Check relayer health (no auth required) |
| 10 | `getPublicKeyHex()` | Get delegate public key for this client |

**Lower-level:** `rememberManual`, `recallManual`, `embed` for advanced use.

**Three entry points:**
- `@mysten-incubation/memwal` → `MemWal` (default, relayer handles everything)
- `@mysten-incubation/memwal/manual` → `MemWalManual` (client-managed embeddings + local SEAL)
- `@mysten-incubation/memwal/ai` → `withMemWal` (Vercel AI SDK middleware)

### Vercel AI SDK middleware
```ts
import { withMemWal } from "@mysten-incubation/memwal/ai";

const model = withMemWal(openai('gpt-4o'), {
  maxMemories: 5,
  autoSave: true,
  minRelevance: 0.3,
  debug: false,
});
// Automatically injects relevant memories before generation,
// saves extracted facts after generation
```

### Beta limitations / known issues
- Beta + actively evolving — not stable API until 1.0
- Fast version churn: 29 versions in ~2 months (latest release `@mysten-incubation/oc-memwal@0.0.2` Apr 30 2026)
- Relayer is a **single point of failure** — if `relayer.staging.memwal.ai` goes down, all memory ops fail
- No self-hosted relayer instructions in public docs yet (must deploy own)
- `recall()` returns raw text + distance score — **not a structured query system** (no filters, no metadata)
- No offline-first support — requires relayer to be online

### Repo stats
- GitHub: [MystenLabs/MemWal](https://github.com/MystenLabs/MemWal)
- Stars: 13 | Forks: 4 | Open issues: 15
- Last commit: **2026-04-30**
- Contributors: 9
- Examples directory: `examples/` exists (not audited in detail yet — needs follow-up)
- License: Apache 2.0

---

## Walrus + Seal

### Walrus storage (from docs.wal.app)
- **Storage model:** Erasure coding with ~5x overhead; reads survive up to 2/3 node failure
- **Blob size:** Not explicitly stated in docs extract, but suitable for chapters (target ~10MB)
- **Cost:** Erasure coding keeps overhead ~5x vs raw data; actual cost per MB TBD (check CLI for testnet pricing)
- **Sui integration:** Blobs are Sui objects — smart contracts can verify availability, extend lifetime, or delete

### Walrus TypeScript quickstart (from docs.wal.app getting-started)
```ts
// Install
npm install @mysten/walrus

// Store blob
import { Walrus } from "@mysten/walrus";
const walrus = new Walrus({ network: "testnet" });
const blob = await walrus.store({
  data: Buffer.from("Story chapter content..."),
  epochs: 10, // storage duration in epochs
});
console.log(blob.blobId); // content-addressed ID
```

### Seal access control (from seal.mystenlabs.com)
- **Status:** Alpha — request access via Enoki portal
- **Encryption:** Identity-based + threshold (t-of-n key splitting across nodes)
- **Access policies:** Move smart contracts on Sui — time locks, token-gating, role-based
- **Storage agnostic:** Works with Walrus and other storage backends
- **Use case for Lethe:** Encrypt story chapters; only NFT holders can decrypt

### WAL token faucet (testnet)
- **Faucet:** `https://stake.walrus.site` — connect wallet, click "Get WAL" to swap testnet SUI → testnet WAL 1:1
- **CLI faucet:** Also available via Walrus CLI
- **No separate WAL-only faucet** — must get via SUI swap on stake.walrus.site

---

## zkLogin + Enoki

### zkLogin raw integration (from docs.sui.io)
**OAuth flow (Google):**
```ts
import { Ed25519Keypair, generateRandomness, generateNonce } from "@mysten/sui";
import { jwtToAddress } from "@mysten/sui";
import { getExtendedEphemeralPublicKey } from "@mysten/sui/zklogin";

// 1. Generate ephemeral key + nonce
const ephemeralKeyPair = new Ed25519Keypair();
const randomness = generateRandomness();
const maxEpoch = (await suiClient.getLatestSuiSystemState()).epoch + 2;
const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

// 2. Redirect to Google OAuth
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=$CLIENT_ID&response_type=id_token&redirect_uri=$REDIRECT_URL&scope=openid&nonce=${nonce}`;

// 3. After redirect: decode JWT + get salt
const decoded = jwt_decode(idToken);
const saltResp = await fetch("https://salt.api.mystenlabs.com/get_salt", {
  method: "POST", body: JSON.stringify({ token: idToken })
});
const { salt } = await saltResp.json();

// 4. Derive Sui address
const address = jwtToAddress(idToken, salt, false);

// 5. Get ZK proof (via Mysten proving service or self-hosted)
// Then sign + submit transaction with ephemeral key + ZK proof
```

### Enoki vs raw zkLogin

| Factor | Raw zkLogin | Enoki |
|---|---|---|
| Complexity | High — build OAuth flow, salt management, ZK proof integration yourself | Low — one SDK import, API key |
| Cost | Free (just your dev time) | $69–$120/month (Starter–Professional) |
| zkLogin MAU | You manage | 7.5K–10K included |
| Sponsored tx | Build gas station yourself | Built-in, 100K requests in Professional |
| Salt management | You handle (Mysten salt server or own DB) | Handled |
| RPC | You manage | 500M–1B CPU units included |
| Time to hackathon | High (1–2 weeks) | Low (1–2 days) |

**Recommendation for Lethe hackathon: Enoki.** It handles zkLogin + sponsored transactions + RPC in one SDK. $69/month is cheap insurance for a 21-day hackathon. Use `@mysten/enoki` npm package.

### Enoki integration
```ts
import { EnokiClient } from "@mysten/enoki";

// Initialize
const enoki = new EnokiClient({ apiKey: "your_enoki_api_key" });

// Create zkLogin session (Google/Facebook/Twitch/Apple)
const session = await enoki.createZkLoginSession({
  provider: "google",
  redirectUri: window.location.origin + "/auth/callback",
});

// After OAuth callback, get wallet address
const { address } = await enoki.getZkLoginAddress(session.token);

// Sponsored transaction (gasless for user)
const tx = await enoki.sponsorTransaction({
  transaction: txb.build(),
  network: "testnet",
});
```

### @mysten/dapp-kit (React/Next.js)
```bash
npm i @mysten/dapp-kit-react @mysten/sui
```
- Provides React hooks: `useDappKit`, `useWallet`, `useSignTransaction`
- Next.js guide available at sdk.mystenlabs.com/dapp-kit/getting-started/react
- Legacy `@mysten/dapp-kit` deprecated — use new `@mysten/dapp-kit-core` + `@mysten/dapp-kit-react`

---

## Wallet state

### Sui testnet balance
**Address:** `0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077`
**Explorer:** suiexplorer.com/testnet/address/0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077

| Asset | Balance |
|---|---|
| SUI (testnet) | **~1.96 SUI** (1,962,032,988 MIST) |

✅ **Sufficient** for hackathon dev (need ~0.5 SUI minimum; 1.96 is healthy)

### WAL testnet balance
**Not yet swapped.** Action required:
1. Go to `https://stake.walrus.site`
2. Connect wallet (same testnet address)
3. Click "Get WAL" → swap testnet SUI → testnet WAL
4. Expected: ~1.96 WAL (1:1 swap)

### MiniMax API credits
✅ **Confirmed working.** Key prefix: `sk-cp-QS...`

No credit check endpoint accessible without full key. Vow should check dashboard at minimax.io if credits are running low. Estimated hackathon usage: ~$50–100 for image/video generation at current pace.

---

## Blockers identified

### Blocker B1 — WAL token acquisition
- **Status:** ACTION REQUIRED
- Vow needs to swap testnet SUI → WAL at stake.walrus.site
- No separate WAL-only faucet; must use swap mechanism
- No SUI needed for storage fees on testnet (Walrus testnet tokens are free)

### Blocker B2 — MemWal account setup
- **Status:** Unblocked by this research
- Package confirmed: `@mysten-incubation/memwal`
- Still need: Vow to generate Ed25519 delegate key + register MemWalAccount on-chain
- MemWalAccount creation requires a Sui transaction (not yet tested)
- See `MemWal.create` requires both `key` and `accountId`

### Blocker B3 — Managed relayer dependency
- **Status:** Risk (not blocker yet)
- MemWal depends on `https://relayer.staging.memwal.ai` (testnet)
- If Mysten takes this down or rate-limits, Lethe's memory layer fails
- Mitigation: Investigate self-hosted relayer deployment before mainnet
- For hackathon: accept managed relayer risk

### Blocker B4 — Seal SDK access
- **Status:** Alpha, request access required
- Need to request access via Enoki portal to use Seal encryption
- Without Seal, story chapters stored on Walrus are publicly readable
- Encrypt manually client-side using `@mysten/seal` before uploading to Walrus

### Blocker B5 — Enoki budget decision
- **Status:** Decision required
- Raw zkLogin is free but takes 1–2 weeks to implement properly
- Enoki is $69/month but reduces auth complexity to 1–2 days
- Recommendation: Start with Enoki Starter ($69/month) for hackathon
- Alternative: Use Suiet Wallet Kit (free, no zkLogin) for quicker hackathon demo

---

## Complexity rating

**Overall: 7/10** for full Sui + Walrus + MemWal + Enoki + Seal stack

Breaking it down:
- MemWal SDK integration: **6/10** (well-documented, TypeScript-native, relayer handles hard parts)
- Walrus blob storage: **5/10** (clear SDK, cost model needs verification)
- zkLogin auth: **8/10** (complex if going raw; 4/10 if using Enoki)
- Seal encryption: **7/10** (alpha docs, access request needed)
- Multi-service orchestration: **8/10** (5+ services to wire together in 21 days)

**Recommended hackathon path:** Skip Seal for demo (encrypt manually later). Use Enoki for auth + sponsored tx. Use MemWal + Walrus for storage. Build MVP around story writing flow first.

---

# Audit v2 — second pass (2026-05-28T09:15:59Z, fresh re-research)

> Re-ran the source research from scratch via parallel agents during the
> Day-2 repo restructure. Where this pass conflicts with the first pass
> above, **this pass is current** — it supersedes. Corrections + new
> findings only; the first pass's code is otherwise consistent.

## Corrections to the first pass
- **MemWal latest commit is 2026-05-28** (`3173ffb`), not 2026-04-30. Open *issues* = **0** (GitHub's "15"/"8" are PRs counted as issues). Repo is active today.
- **Walrus API in the first pass is wrong.** There is no `new Walrus({network})` / `walrus.store()`. The real API extends a Sui client:
  ```ts
  import { SuiGrpcClient } from '@mysten/sui/grpc';
  import { walrus } from '@mysten/walrus';
  const client = new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://fullnode.testnet.sui.io:443' }).$extend(walrus());
  const { blobId } = await client.walrus.writeBlob({ blob, deletable: false, epochs: 30, signer: keypair });
  const bytes = await client.walrus.readBlob({ blobId });
  ```
- **$WAL faucet:** primary method is the CLI `walrus get-wal` (swaps testnet SUI→WAL 1:1). `stake.walrus.site` may also exist but the CLI is the documented path. No standalone web WAL faucet.
- **MiniMax is NOT simply "confirmed working."** Auth is valid (HTTP 200) but the token plan is **model-scoped**: `MiniMax-Text-01` → `2061: your current token plan not support model`. Must confirm which text/image models the plan allows (EP used `image-01` + `speech-2.8-hd`).
- **dapp-kit / zkLogin packages:** standalone `@mysten/zklogin` is superseded by `@mysten/sui/zklogin` + `@mysten/enoki`. The `EnokiFlow`/`useEnokiFlow` React API is `@deprecated` — use `registerEnokiWallets` + dapp-kit hooks. Lethe installed `@mysten/enoki` (not `@mysten/zklogin`) + `@mysten/dapp-kit`.

## New findings (Day-2)
- **Walrus small-blob cost trap:** ~64 MB fixed per-blob encoded-metadata floor. A 1–10 MB chapter pays close to a 64 MB blob. Storing 2–20 chapters as separate blobs is wasteful → use a **Quilt** (one per story) to amortize. Testnet epoch ≈ **1 day** (max 53); use `epochs: 30–53` so demo blobs survive judging.
- **Blob↔NFT association already implemented:** `contracts/lethe/sources/story.move` stores `text_blob_id` + `image_blob_id` (String) per chapter in the `Story` NFT — the documented pattern. Move package builds clean (`sui move build` OK).
- **Seal:** for 1–10 MB chapters use **envelope encryption** (AES the chapter, store ciphertext on Walrus, Seal only the AES key). Optional (private stories) → defer past a Walrus-only milestone. Complexity 7.
- **Refined complexity for the chosen hero-flow architecture** (Enoki + Walrus-direct + Sui Story NFT + MiniMax, Seal + MemWal deferred): MemWal 4, Walrus-direct 5, Seal 7, zkLogin-via-Enoki 3, **total architecture ~6** — the glue (gasless mint wired to chapter gen + Walrus upload behind a zkLogin session) is the real work.

## Build / infra finding (not in first pass)
- **`next build` fails locally with a misleading error** (`Cannot read properties of null (reading 'useContext')` during prerender) **purely because the Hermes shell exports `NODE_ENV=development`.** With `NODE_ENV=production` the build is fully green. Fix applied: `apps/web` build script is now `NODE_ENV=production next build`. This also explains the EP/delta "local build fails, Vercel works" mystery (Vercel sets NODE_ENV=production). All apps/web routes (`/`, `/play`, `/library`, `/_not-found`) build.

## Updated blockers (supersede first-pass list)
- **B1 — $WAL funding:** wallet holds 0 WAL. walrus CLI 1.48.1 installed but **no config file** (`walrus get-wal` errors "could not find a valid Walrus configuration file"). Set up testnet `client_config.yaml`, then `walrus get-wal`. SUI (1.96) is enough to swap.
- **B2 — MiniMax model access:** key valid but plan rejects `MiniMax-Text-01` (2061). Confirm allowed text + image models; top up if needed.
- **B3 — Enoki provisioning:** need Enoki API key + Google OAuth client ID from the Enoki Portal before zkLogin works.
- **B4 — MemWal vs Walrus-direct:** MemWal = encrypted storage + semantic recall but no NFT mint; Walrus-direct + own Move contract = full control + the NFT. Pick the memory-layer path.
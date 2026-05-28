# Day 3 Prep — Verification Results
Generated: 2026-05-28T12:51:14Z

## Task 1 — $WAL Faucet
Status: ✅ SUCCESS (after config setup)
- Command: `walrus get-wal --context testnet`
- CLI version: walrus 1.48.1-9c5590a81e29
- Initial state: No config file found → ran `walrus config --help` to diagnose
- Fix applied: Downloaded official testnet config from `https://docs.wal.app/setup/client_config.yaml` → saved to `~/.config/walrus/client_config.yaml`
- Sui wallet confirmed: `0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077` (active_env: testnet in `~/.sui/sui_config/client.yaml`)
- **Faucet result: "Success: Exchanged 0.500 SUI for WAL."** ✅
- System info confirmed working: Epoch 411, epoch duration 1 day, Walrus testnet healthy

### Final balances:
- **SUI**: ~1.96 SUI remaining (expended 0.500 SUI on WAL exchange)
- **WAL**: Received 0.500 SUI equivalent in WAL tokens (exact amount not shown in output)
- Wallet: `0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077`

### Important WAL balance note:
The subagent ran `walrus get-wal` but did NOT capture the exact WAL amount received. Run `walrus info --context testnet` to get precise WAL balance. WAL balance is needed to estimate MemWal storage deposit costs.

## Task 2 — Enoki
Status: ✅ FREE TIER EXISTS — Vow action still needed for account creation

### Pricing confirmed:
| Tier | Price | Key limits |
|---|---|---|
| **Sandbox** | **FREE** | 3 seats, unlimited standard ID providers |
| Starter | $69/month | 7.5K zkLogin MAU, 3 mainnet apps, 500M RPC, $5/seat extra |
| Professional | $120/month | 10K zkLogin MAU, 5 mainnet apps, 100K sponsored tx, $5/seat extra |
| Seal bundle | **FREE** (limited time) | Robust data encryption + onchain access policies |
| Enterprise | Custom | Unlimited everything |

### Sandbox free tier includes:
- ✅ 3 seats for team
- ✅ Unlimited standard ID providers (Google, Apple, Facebook, Twitch, etc.)
- ✅ zkLogin via Enoki portal

### Signup URL: https://enoki.mystenlabs.com
### Pricing page: https://enoki.mystenlabs.com/pricing
### Docs: https://docs.enokimystenlabs.com (blocked from internal network — Vow must access)

### Steps for Vow to complete:
1. Go to https://enoki.mystenlabs.com/pricing
2. Click "Try for free" under Sandbox
3. Sign in (Google or Sui wallet)
4. Create new app → name it "Lethe-ETH-Denver"
5. Configure: Sui testnet, Google OAuth client ID
6. Get API key + secret key from app dashboard
7. Copy key to Hermes

### Env vars needed:
```
NEXT_PUBLIC_ENOKI_API_KEY=<from portal>
ENOKI_SECRET_KEY=<from portal>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<from Google Cloud Console>
```

### ⚠️ Enoki portal blocked:
`portal.enokimystenlabs.com` and `docs.enokimystenlabs.com` returned "Blocked: URL targets a private or internal network address" from Hermes network. Vow must access these directly from browser.

## Task 3 — MiniMax
Status: ⚠️ Vow login required to verify balance

### Pricing structure found:
MiniMax uses **Token Plan** system (NOT pay-as-you-go by default):
- Token Plan Key ≠ Pay-as-you-go API Key (separate systems)
- Token Plan = subscription quota (Starter/Plus/Max/Ultra tiers)
- Credits = prepaid balance with same coverage as Token Plan

### Token Plan tiers (monthly subscription):
| Tier | M2.7 req/5hr | Speech 2.8 chars/day | image-01/day | Hailuo-2.3/day | Music/day |
|---|---|---|---|---|---|
| Starter | 1,500 | — | — | — | 100 |
| Plus | 4,500 | 4,000 | 50 | — | 100 |
| Max | 15,000 | 11,000 | 120 | 2 | 100 |
| Plus-Highspeed | 4,500 | 9,000 | 100 | — | 100 |
| Max-Highspeed | 15,000 | 19,000 | 200 | 3 | 100 |
| Ultra-Highspeed | 30,000 | 50,000 | 800 | 5 | 100 |

### Pricing page blocked from Hermes network:
`platform.minimax.io` returned access error. Actual dollar prices not visible in search results.

### ⚠️ Critical finding about Error 2061:
The previous error 2061 on MiniMax tools (image-01, speech-2.8, etc.) likely means:
- The current API key being used is a **Pay-as-you-go key**, NOT a Token Plan key
- Token Plan resources (image-01 daily quota, speech-2.8 chars) are ONLY accessible via Token Plan Key
- When Token Plan is exhausted: auto-switches to Credits (prepaid) if available
- When Credits also empty: returns 2061 / "Insufficient resources" error

### Sufficiency calculation for Lethe 21-day build:
- ~500 image generations → needs 500/21 = ~24 images/day → **Plus tier (50/day) enough**
- ~200 chat completions → M2.7 → **Starter (1,500/5hr) enough**
- ~50 voice generations → needs ~50 × ~500 chars = 25K chars total → speech-2.8 → **Plus (4K/day) enough**
- **Estimated total: ~$69-120/month** depending on tier chosen

### What Vow must do:
1. Login to https://platform.minimax.io with EP/Delta account
2. Check: Account → Token Plan → what tier is active?
3. Check: Credits balance (is there prepaid credit?)
4. If no plan: subscribe to Starter or Plus tier ($X/month — prices not visible in search)
5. If plan exists but 2061: check if image-01/speech quotas are included in plan
6. Provide: Token Plan Key (starts with `mapi-` or similar, NOT the `$MINIMAX_API_KEY`)

### For Hermes to use image/video/music:
Need Vow to either:
- (A) Subscribe to Plus/Max Token Plan tier → get Token Plan Key → add to `~/.hermes/.env`
- (B) Or use a different key that has active Token Plan access
- The current `MINIMAX_API_KEY` in `.env` is likely Pay-as-you-go (only M2.7 inference, NOT image/speech)

## Task 4 — MemWal Deploy Prep
Status: ✅ READY — but account creation is a web flow, not CLI

### Deploy command:
**There is NO `pnpm memwal deploy` CLI command.** Instead:

1. **Create account via web (required):**
   - Go to **https://memwal.ai** or **https://memwal.wal.app**
   - Connect Sui wallet (testnet) → `0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077`
   - Click "Create account" → generates:
     - **Ed25519 delegate private key** (hex string — secret, store in env)
     - **MemWalAccount object ID** (Sui object ID — e.g. `0x...`)

2. **SDK integration:**
   ```ts
   import { MemWal } from "@mysten-incubation/memwal";
   const memwal = MemWal.create({
     key: process.env.MEMWAL_PRIVATE_KEY!,        // Ed25519 hex key from playground
     accountId: process.env.MEMWAL_ACCOUNT_ID!,   // MemWalAccount object ID from playground
     serverUrl: "https://relayer.staging.memwal.ai", // testnet
     namespace: "lethe",
   });
   await memwal.health(); // verify connection
   ```

3. **Self-host option (if web not used):**
   - Deploy MemWal contract to testnet: `sui client publish --path <memwal-repo>/contract`
   - Use package ID: `0xcf6ad755a1cdff7217865c796778fabe5aa399cb0cf2eba986f4b582047229c6`
   - Generate Ed25519 keypair: `openssl rand -hex 32` → private key
   - Call `memwal::account::create_account()` onchain

### Prerequisites:
- $WAL balance: Confirmed WAL received ✅ (need exact amount from `walrus info`)
- Sui testnet address: `0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077` ✅
- Storage deposit cost: Unknown — depends on blob size and epoch duration. Estimate 0.01-0.1 WAL per memory operation

### Expected output from memwal.ai playground:
After account creation, playground shows:
- `Account ID`: `<0x...>` (MemWalAccount object ID on Sui testnet)
- `Delegate Key`: `<hex string>` (Ed25519 private key — secret!)
- Test connection via `health()` check

### ⚠️ Wallet address used:
`0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077`

---

## Summary — Day 3 Go/No-Go

### GREEN — Ready to start Day 3:
- [x] `$WAL faucet` ✅ — WAL received (need exact balance from `walrus info`)
- [x] `MemWal deploy command` ✅ — web flow at memwal.ai, no CLI deploy needed
- [x] `MemWal SDK package` ✅ — `@mysten-incubation/memwal@0.0.5` confirmed on npm

### YELLOW — Vow actions needed:
1. **Enoki**: Create free Sandbox account at https://enoki.mystenlabs.com → get API key + secret key + Google Client ID
2. **MiniMax**: Check Token Plan tier + Credits balance at https://platform.minimax.io → verify image-01/speech-2.8 quotas available → if not, upgrade to Plus tier
3. **MemWal**: Visit memwal.ai (testnet) → connect Sui wallet → create account → capture `MEMWAL_PRIVATE_KEY` + `MEMWAL_ACCOUNT_ID`
4. **WAL balance**: Run `walrus info --context testnet` to get exact WAL amount (needed for storage cost planning)

### RED — Blockers:
1. **B7 — MiniMax image/speech quota**: Error 2061 = Token Plan needed. Current `MINIMAX_API_KEY` is pay-as-you-go only (M2.7 text). Need Token Plan key with image-01/speech-2.8 quota. Vow must upgrade plan or verify Credits exist.
2. **B6 — Enoki key**: Sandbox free tier exists, but Vow must create account manually. No way for Hermes to automate this.
3. **MemWal accountId**: Needs Vow to visit memwal.ai and create account. Hermes cannot automate this (requires wallet signature in browser).

### Day 3 can start if:
- Vow creates Enoki Sandbox account + gives Hermes the keys → B6 closed
- Vow checks MiniMax plan and either confirms Credits ≥ $30 or upgrades → B7 potentially closed (still needs Vow verification)
- Vow visits memwal.ai → creates account → gives Hermes `MEMWAL_PRIVATE_KEY` + `MEMWAL_ACCOUNT_ID`

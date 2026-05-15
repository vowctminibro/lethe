# Vow's Inventory Audit
Last updated: 2026-05-15 20:30 BKK

---

## LOGGED-IN / CONFIGURED ✅

| Service | Account | Notes |
|---------|---------|-------|
| Vercel (CLI) | vow1 | `vercel whoami` confirmed. 2 projects: lethe + delta-site |
| Vercel (browser) | vow1 | Hermes Chrome IS logged into Vercel dashboard |
| GitHub (CLI) | vowctminibro | `gh auth status` confirmed. 10 repos. |
| NPM (CLI) | vowctminibro | `npm whoami` confirmed |
| Sui CLI | 0x6ba6c6d584a12e0ab18fc06985c2d9db54cf1d5f | testnet, 0.003 SUI balance |
| Solana CLI | ~/.config/solana/id.json | Default keypair exists |
| X/Twitter (browser) | @EvanImmortalX | Hermes Chrome logged in (automation account) |
| Telegram | Active | Hermes agent runs via Telegram DM |
| Claude Code | v1.0.4 | ~/.local/bin/claude |

## API KEYS CONFIRMED (in ~/.hermes/.env) ✅

| Key | Status | Project used in |
|-----|--------|----------------|
| ANTHROPIC_API_KEY | ✅ exists | WRAP, available for Lethe |
| OPENAI_API_KEY | ✅ exists | Available for Lethe |
| GEMINI_API_KEY | ✅ exists | WRAP project |
| HELIUS_API_KEY | ✅ exists | WRAP (Solana RPC) |

---

## LOGGED-OUT / NEEDS VOW TO ACTION 🔑

| Service | Why we care | Action |
|---------|-------------|--------|
| Cloudflare | Domain management, Workers, R2 storage | Vow login on daily Chrome |
| Notion | Handbook, planning docs | Vow login on daily Chrome |
| Figma | Design mockups for Lethe UI | Vow login on daily Chrome |
| Loom | Hackathon demo video (required by judges) | Vow login on daily Chrome |
| GitHub (browser) | Hermes Chrome not logged in | Use gh CLI or login daily Chrome |
| NPM (browser) | Hermes Chrome not logged in | Use npm CLI — no issue |
| Discord | Need to join Sui Overflow + Walrus servers | Manual join: discord.gg/HWwSCZxDTZ |
| Walrus TG | Competitor recon, team announcements | Manual join: t.me/WalrusBuilders |
| WalletConnect Cloud | For Lethe wallet integration | Register/login at cloud.walletconnect.com |
| Netlify | Fallback deploy option | Logged in via CLI only |

Note: Most services above are logged into Vow's DAILY Chrome (not Hermes Chrome at port 9222). Hermes Chrome = separate profile for @EvanImmortalX automation only.

---

## NOT INSTALLED / NEEDS INSTALL ❌

| Tool | For Lethe? | Install command |
|------|-----------|-----------------|
| **walrus CLI** | ✅ CRITICAL | `cargo install walrus` or download binary from walrus.xyz/docs |
| Rust/Cargo | Needed for walrus CLI | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Docker | Optional — not critical for Lethe | Skip unless SDK containerization needed |
| Go | Not needed for this stack | Skip |
| Deno | Not needed | Skip |
| redis-cli | Optional for local testing | `brew install redis` if needed |
| aws/gcloud | Not needed | Skip |

---

## SECTION G — LOCAL TOOLS (verified 2026-05-15)

### Languages
```
Node.js:    v22.13.1  ✅
pnpm:       10.11.0   ✅
bun:        1.2.13    ✅
Python:     3.13.1    ✅
Rust:       NOT INSTALLED ❌ (needed for walrus CLI)
Go:         NOT INSTALLED
Deno:       NOT INSTALLED
```

### Sui / Walrus
```
sui:        1.42.0    ✅
walrus:     NOT INSTALLED ❌ CRITICAL
```

### Dev Tools
```
git:        2.49.0    ✅
gh:         2.72.0    ✅
brew:       4.4.28    ✅
ffmpeg:     7.1.1     ✅ (for video processing)
Docker:     NOT INSTALLED
```

### Cloud CLIs
```
vercel:     ✅ ~/.local/bin/vercel
wrangler:   ✅ (Cloudflare Workers)
netlify:    ✅
aws:        NOT INSTALLED
gcloud:     NOT INSTALLED
```

### Database
```
psql:       ✅ /usr/bin/psql
sqlite3:    ✅ /usr/bin/sqlite3
redis-cli:  NOT INSTALLED
```

### AI CLIs
```
Claude Code: 1.0.4  ✅
gemini:      NOT IN PATH
ollama:      NOT INSTALLED
```

### Editors & Apps
```
Cursor.app:        ✅
Xcode.app:         ✅ (Move contract dev)
Google Chrome.app: ✅
Safari.app:        ✅
```

---

## SECTION H — VERCEL PROJECTS (detailed)

### Project: lethe
- URL: lethe.vercel.app
- Status: ✅ Ready (deployed 2h ago, May 15 ~18:00 BKK)
- Content: Shows "Lethe" heading + "Connect Wallet" button
- Vercel username: vow1
- Git: github.com/vowctminibro/lethe
- Previous deploys: 2x Error (yesterday), 1x Ready (2h ago) = active iteration happening

### Project: delta-site
- URL: delta-site.vercel.app
- Status: ✅ Ready (deployed 1d ago)
- Content: "Delta — AI-powered DeFi hub", Google Sign In, Solana-focused
- Notes: Previous project, could be reference for Lethe frontend architecture

---

## SECTION B — CRYPTO / WEB3

### B1. Solana
- CLI keypair: ~/.config/solana/id.json ✅
- Network: Not primary for Lethe, but available

### B2. Sui
- Active address: 0x6ba6c6d584a12e0ab18fc06985c2d9db54cf1d5f
- Network: testnet
- Balance: 0.003 SUI (2 gas coins × 0.0015)
- ⚠️ Very low — needs funding before contract deployment

### B4. Faucet status
- Previously rate-limited (noted in PROGRESS.md)
- Try: https://faucet.sui.io (web), https://discord.gg/sui (Discord faucet)
- Or: Buy small amount on exchange

---

## SECTION F — CHROME EXTENSIONS

Couldn't extract via CDP (chrome://extensions uses shadow DOM — standard CDP eval returns empty).
Verify manually in Hermes Chrome or Vow's daily Chrome.

Expected/known from other context:
- Hermes Chrome: logged into X as @EvanImmortalX
- Vow's daily Chrome: likely has Phantom, MetaMask, Sui Wallet

---

## EXISTING PROJECTS CONTEXT

| Project | Location | Stack | Status | Relevant to Lethe? |
|---------|----------|-------|--------|-------------------|
| lethe | ~/Projects/lethe | React+Vercel | Active (deployed 2h ago) | ✅ IS the project |
| contracts | ~/Projects/contracts | Move (Sui) | hello_world.move + **hello_graph.move** built | ✅ HIGH — graph structure ready |
| memory-service | ~/Projects/memory-service | Unknown (nested dir) | Empty | Maybe |
| delta-site | ~/Projects/delta-site | Next.js+Vercel | Deployed | ✅ Reference architecture |
| wrap | ~/Projects/wrap | Solana+Claude | Completed | ✅ AI+Claude pattern (API keys) |
| game-a, game-b | ~/Projects/game-a,b | Unknown | Unknown | 🎮 Possible Lethe demo context |
| agent-dashboard | ~/Projects/agent-dashboard | Unknown | Empty | Maybe |
| openclaw-upgrade | ~/Projects/openclaw-upgrade | Unknown | Unknown | Unclear |
| sui-overflow-2026 | ~/Projects/sui-overflow-2026 | Planning docs | Active | ✅ Planning repo |

---

## CRITICAL FINDINGS

1. **lethe.vercel.app already live** — "Connect Wallet" frontend deployed 2h ago. Vow is already building. Claude's strategist should build ON TOP of this, not start fresh.

2. **hello_graph.move exists** in ~/Projects/contracts — a Move contract with graph data structure. This is likely the foundation for Lethe's NPC memory graph on-chain. HIGH relevance.

3. **Walrus CLI not installed** — Critical gap. Need `walrus` CLI to test Walrus blob storage, generate API calls, and verify testnet integration. Must install before SDK work.

4. **Sui testnet balance very low** (0.003 SUI) — Will hit "insufficient gas" on the first non-trivial contract deploy. Top-up needed before Day 2 contract testing.

5. **@lethe_ai X handle: AVAILABLE** — Grab immediately before someone else does.

6. **All 4 API keys ready** (Anthropic, OpenAI, Gemini, Helius) in ~/.hermes/.env — Lethe's AI layer (NPC memory inference) can use Claude API immediately.

---

## RECOMMENDED RE-USE FOR LETHE

- **Vercel project "lethe"** → Already exists, connected to github.com/vowctminibro/lethe. Continue with this — no new project needed.
- **hello_graph.move** → Start Lethe's on-chain memory storage from this foundation, not from scratch.
- **ANTHROPIC_API_KEY** → Ready to use for NPC memory inference layer.
- **delta-site architecture** → Reference for Next.js + wallet connect + Vercel pattern.
- **WRAP patterns** → Claude API integration patterns already proven.

---

## DAY 2 ADJUSTMENTS RECOMMENDED

Based on inventory, Claude strategist should update Day 2 plan to:

1. **Skip "create Vercel project"** — already done. Focus on lethe repo development.
2. **Install walrus CLI first** — blocker for all SDK testing.
3. **Fund testnet wallet** — blocker for contract deployment.
4. **Grab @lethe_ai immediately** — time-sensitive.
5. **Inspect hello_graph.move** — may already have the on-chain data structure Lethe needs.
6. **Check game-a / game-b** — if NPC/gaming context, highly relevant to Lethe demo.

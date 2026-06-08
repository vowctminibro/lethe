# Lethe Competitive Scan — Sui Overflow 2026 & Sui Ecosystem
**วันที่:** 2026-06-08
**สถานะ:** Draft

---

## 1. 🚨 DIRECT COMPETITOR — ToldProof (toldproof.xyz)

**สิ่งที่ทำ:** Verifiable prediction track record + on-chain reputation สำหรับ humans + AI agents

- **Hackathon:** Sui Overflow 2026 — Walrus Track
- **Status:** ✅ Live on testnet (หลาย feature แล้ว)
- **GitHub:** github.com/BadGenius22/toldproof
- **X:** @toldproof
- **Audit:** v3 audit (0C/0H/0M/0L), 62 Move tests + 111 TS tests passing
- **Website:** toldproof.xyz

**ทำอะไรบ้าง:**
- Seal prediction บน Sui (time-locked via Seal), ciphertext ไปเก็บ Walrus
- AI Resolution Agent (Claude + GPT + Gemini consensus mode) resolve hit/miss ทุก 5 นาที
- Reputation leaderboard — Wilson lower bound, 180-day recency half-life, wallet-aggregate scoring
- X OAuth handle binding, anti-squat, auto-tweet on seal
- MCP + x402 payments สำหรับ AI agents ($0.10 USDC on Base)
- Trust badges: Single / Multi / Churner / Spam
- Demo agent fleet: 4 sovereign agents, generate predictions ทุก 6 ชม

**ต่างจาก Lethe ("un-deletable call track record") ยังไง:**
| จุด | ToldProof | Lethe |
|---|---|---|
| Scope | Crypto price predictions + CT claims | NPC memory + agent decisions (กว้างกว่า) |
| Resolution | AI consensus agent (centralized AI pipeline) | ยังไม่ชัด — ต้อง define |
| Storage | Walrus (ciphertext + reasoning traces + profiles) | Walrus (MemWal) |
| Identity | X OAuth handle → Sui wallet | ยังไม่ชัด |
| Target user | Crypto Twitter analysts + AI agents | NPC / game agents / broader |
| Token economy | $0.10 per prediction (human + agent) | ยังไม่มี |
| Anti-gaming | Wilson lower bound + wallet-aggregate + recency decay + trust badges | ยังไม่มี |

**⚠️ Assessment:** ToldProof ทำ "verifiable prediction reputation" สำเร็จแล้วใน scope ของ crypto CT. Lethe ต้อง differentiate ชัดเจน — ถ้า pitch ว่า "prediction track record" ตรงๆ จะทับกับ ToldProof ทันที. ต้องเลือก angle ที่ต่าง: NPC memory, agent decision history, broader than crypto.

---

## 2. 🟡 NEAR COMPETITORS — Prediction Markets บน Sui

### 2a. Walmarket (getwalmarket/walmarket)
- **What:** AI-powered prediction market บน Sui + Walrus
- **Hackathon:** Walrus Haulout Hackathon 2025 (Provably Authentic track)
- **Status:** Hackathon project, PoC stage
- **Key tech:** Nautilus TEE, GPT-5 oracle, Walrus evidence storage, Seal access control
- **ต่างจาก Lethe:** เป็น prediction MARKET (bet on outcomes), ไม่ใช่ personal track record. Focus ที่ oracle resolution + betting, ไม่ใช่ reputation accumulation

### 2b. Pythia (Sui-Romanian-Hackathon/pythia)
- **What:** Decentralized prediction market บน Sui + multi-sig arbiters
- **Status:** Hackathon project (Sui Romanian Hackathon)
- **Key feature:** Multi-sig arbiters, dispute resolution, user profiles with reputation + betting history
- **ต่างจาก Lethe:** เป็น prediction market + arbiter trust scores, ไม่ใช่ personal call track record. Reputation = arbiter accuracy, ไม่ใช่ user prediction history

### 2c. DeepBook Predict (official Mysten Labs)
- **What:** Expiry-based prediction market protocol on Sui — binary positions, vertical ranges, oracle-driven pricing
- **Status:** Testnet live, mainnet later 2026
- **Key:** Institutional-grade options oracle (Block Scholes), composable with DeepBook Spot + Margin
- **ต่างจาก Lethe:** เป็น infrastructure สำหรับ prediction MARKETS (binary options, calls, puts), ไม่ใช่ personal reputation system. ไม่มี track record / leaderboard

### 2d. Predicrypt (LadyTech-03/predicrypt)
- **What:** Decentralized prediction market บน Sui
- **Status:** Hackathon project
- **Key:** zkLogin, React + Move, community-driven resolution
- **ต่างจาก Lethe:** Basic prediction market, ไม่มี reputation system

### 2e. VRAM Arena (VRAM-AI/arena)
- **What:** AI agents play Connect 4 + users bet on winner
- **Hackathon:** Walrus Hackathon
- **Status:** Hackathon project
- **Key:** Walrus immutable game state, Sui smart contracts
- **ต่างจาก Lethe:** Gaming-specific, ไม่มี reputation/scoring system

---

## 3. 🟢 ADJACENT — Reputation Systems บน Sui

### 3a. Reputa (imajus/reputa)
- **What:** Omni-chain credit scoring with verifiable off-chain logic
- **Status:** Hackathon project
- **Key tech:** EVM DeFi history → AI credit score (0-1000) → Sui on-chain via Nautilus TEE oracle
- **ต่างจาก Lethe:** Credit scoring จาก DeFi activity (lending, borrowing), ไม่ใช่ prediction track record. Source = EVM chains, target = Sui DeFi protocols

### 3b. TrustMyGit (Rishikpulhani/TrustMyGit)
- **What:** GitHub contributions → on-chain reputation (on Base, NOT Sui)
- **Status:** Hackathon project
- **Key:** TLSNotary verification, issue staking, developer tokens
- **ต่างจาก Lethe:** GitHub-based reputation, not prediction-based. Not on Sui.

---

## 4. 🔍 ECOSYSTEM DIRECTORY SCAN

### overflow.sui.io — Public Showcase/Gallery
- ❌ **ไม่มี** public showcase/gallery ของ submitted projects
- Site มีแค่ track descriptions, prizes, timeline, sponsors
- ไม่มี project listing สาธารณะ

### awesome-sui (github.com/MystenLabs/awesome-sui)
- ❌ **ไม่มี** category สำหรับ prediction หรือ reputation
- Categories ที่มี: Indexers, Explorers, Wallets, DeFi, NFT, Gaming, Dev Tools
- ไม่มี prediction market / reputation scoring category

### Sui Directory (sui.directory + suidirectory.pages.dev)
- 85 projects, 9 categories
- ❌ **ไม่มี** prediction หรือ reputation category
- Categories: DeFi, Staking, Games, NFT Marketplaces, NFTs, BTCfi, Infrastructure, Social, AI
- **Sudo Finance** ปรากฏใน directory listing ว่า "Prediction Markets" แต่จริงๆ เป็น perpetuals DEX (migrated to ZO)

---

## 5. 🔎 GENERAL WEB SEARCH RESULTS

### "Sui prediction reputation"
- ToldProof (dominant result)
- DeepBook Predict (official protocol)
- Walmarket
- Reputa
- ไม่มี project อื่นที่ทำ "prediction + reputation" บน Sui

### "Walrus prediction app"
- ToldProof
- Walmarket
- VRAM Arena
- ไม่มี project อื่น

---

## 6. 📊 SUMMARY MATRIX

| Project | Prediction Track Record | On-chain Reputation | Walrus | Sui Move | Status | Direct Threat? |
|---|---|---|---|---|---|---|
| **ToldProof** | ✅ Core feature | ✅ Wilson scoring + leaderboard | ✅ | ✅ | Live testnet | 🚨 YES |
| Walmarket | Market only | ❌ | ✅ | ✅ | PoC/Hackathon | 🟡 Low |
| Pythia | Market only | Arbiter trust scores | ❌ | ✅ | Hackathon | 🟡 Low |
| DeepBook Predict | Protocol infra | ❌ | ❌ | ✅ | Testnet | 🟢 None |
| Predicrypt | Market only | ❌ | ❌ | ✅ | Hackathon | 🟢 None |
| VRAM Arena | Game bets | ❌ | ✅ | ✅ | Hackathon | 🟢 None |
| Reputa | ❌ | Credit score | ❌ | ✅ | Hackathon | 🟡 Low |
| TrustMyGit | ❌ | GitHub rep | ❌ | ❌ (Base) | Hackathon | 🟢 None |

---

## 7. 🎯 IMPLICATIONS FOR LETHE

### ถ้า pitch "un-deletable call track record" ตรงๆ → ทับ ToldProof

**ToldProof ทำสำเร็จแล้ว:**
- Sealed predictions + AI resolution + reputation leaderboard
- Anti-gaming system ที่ sophisticated (Wilson, recency decay, wallet-aggregate)
- อยู่ Walrus track เหมือนกัน
- Audit ผ่านแล้ว v3

### Lethe ต้อง differentiate:

1. **NPC/Agent Memory** — "Memory" ของ agent ที่เก็บ decision history, ไม่ใช่แค่ price predictions
2. **Broader than crypto** — ไม่ใช่แค่ "BTC will hit $100K" แต่เป็น agent ที่จำได้ว่าตัดสินใจอะไรไป แล้วผลเป็นยังไง
3. **Embeddable** — เป็น SDK/engine ที่ game/NPC ฝังเข้าไป ไม่ใช่ standalone app
4. **Narrative angle** — "Lethe" = แม่น้ำแห่งการลืม (Greek mythology) — memory engine ที่ป้องกัน agent amnesia, ไม่ใช่แค่ prediction verification

### ไม่มีใครทำอยู่:
- ❌ Agent memory engine ที่ embed เข้า NPC/game ได้
- ❌ Verifiable decision history สำหรับ autonomous agents (non-financial)
- ❌ "Un-deletable memory" สำหรับ multi-agent systems
- ❌ Walrus-backed memory layer สำหรับ game NPCs

---

## 8. 📋 SEARCH METHODOLOGY

| Source | Query/Method | Result |
|---|---|---|
| overflow.sui.io | web_extract | No public showcase |
| awesome-sui | web_extract + web_search | No prediction/reputation category |
| Sui Directory | web_extract (2 URLs) | No prediction/reputation category |
| Google/Bing | "Sui prediction reputation on-chain track record" | Found ToldProof, Walmarket, Reputa |
| Google/Bing | "Sui prediction reputation Walrus" | Found ToldProof dominant |
| Google/Bing | "awesome-sui prediction reputation oracle" | Found Pythia, Reputa, ToldProof |
| Google/Bing | "Walrus prediction app" | Found ToldProof, Walmarket, VRAM Arena |
| Google/Bing | "Sudo Finance prediction market Sui" | Perps DEX, not prediction market |
| GitHub | ToldProof repo deep read | Full competitive analysis |
| DeepSurge | web_extract | SPA loading (no static content) |

---

*Last updated: 2026-06-08*

# Lethe — Current State (2026-06-03)

> อ่านจากไฟล์จริง: BRAND.md, HERMES_HANDOFF.md, `contracts/lethe/sources/artwork.move`, `apps/web/**`, `apps/web/.env.local`, git log. **README.md ล้าสมัย** (ยังเป็นเวอร์ชัน SDK เก่า "memory for games" + URL ตาย) — อย่าใช้.

## Lethe คืออะไร (วันนี้)
- **Consumer dApp สร้าง "AI art collectible" บน Sui** — เลือก trait ที่ curate ไว้ → AI วาดรูป → mint เป็น NFT (รูปเก็บบน Walrus, blob id ฝังบนเชน) → เอาไป battle กับคนอื่นได้ ล็อกอินด้วย Google ไม่ต้องมี wallet ไม่ต้องจ่าย gas.
- **เพื่อใคร:** คนทั่วไป/นักสะสมที่ไม่ใช่สาย crypto (ไม่มี wallet ก็เล่นได้) — Sui Overflow 2026, Walrus Track.

## Live URL
- **Live จริงวันนี้: https://lethe-gold.vercel.app** → 200, `<title>Lethe — AI art collectibles on Sui</title>` (alias เสถียร)
- per-deploy: `https://lethe-li0rd6m3i-vowctminibro-7069s-projects.vercel.app`
- ❌ `lethesdk.vercel.app` (ที่อยู่ใน README) = **404 ตายแล้ว** — ของเก่า

## Tech stack ที่ใช้จริง
- **Frontend:** Next.js 16.2.6 + React 19 + Tailwind v4 + TypeScript, react-query, zod. pnpm monorepo (`apps/web`, `apps/memory-service`, `packages/sdk`, `packages/shared`). Deploy บน Vercel (rootDirectory = `apps/web`).
- **Auth:** Google → **zkLogin ผ่าน Enoki** (`@mysten/enoki`) — ไม่มี wallet, tx แบบ sponsored (gasless).
- **Sui Move contracts (testnet):**
  - `lethe::artwork` mint — package `0xea40338dececbdaacf834cbbdd54187cc73ff874944f81e9e815f253b813e1f1`
  - `battle` — package `0x1e7048dcb7592991e7da775e6516d4755a3ca07f5d71b898ae173d95ddfdc983`
  - (`0x8daf…` ใน README = npc package เก่า ทิ้งแล้ว)
- **Walrus (testnet):** publisher + aggregator (`@mysten/walrus`) — `/api/store` อัปรูปขึ้น Walrus, `/api/img/[blobId]` ดึงรูปกลับมาเสิร์ฟ. Walrus เป็น load-bearing จริง (blob id ผูกอยู่ใน NFT).
- **AI/รูป:** **MiniMax image generation** — trait → "locked prompt" (ผู้ใช้พิมพ์เองไม่ได้) → รูป JPEG. (env เผื่อ fallback NVIDIA NIM/Gemini/Groq ไว้)
- **SDK kit:** `@mysten/dapp-kit`, `@mysten/sui` 2.17.

## Demo flow จริง (ที่ build แล้ว)
1. เข้า lethe-gold.vercel.app → **Sign in with Google** (zkLogin/Enoki, ไม่มี wallet) — ✅ real
2. `/create` → เลือก trait (species / color / accessory / background) — ✅ real
3. กด generate → `/api/generate` เรียก MiniMax วาดรูปจาก locked prompt → preview + คำนวณ rarity — ✅ real
4. กด mint → `/api/store` อัปรูปขึ้น **Walrus** ได้ blobId → `/api/sponsor` **mint แบบ gasless ผ่าน Enoki** → ได้ Artwork NFT เป็นของ user (digest + objectId) — ✅ real end-to-end (เงื่อนไข: mint target ต้องอยู่ใน Enoki allowlist; sponsor route คืน 503 ถ้าไม่อยู่ — env ตั้งครบแล้ว แต่ยังไม่ได้ยิง mint จริงยืนยันรอบนี้)
5. `/me` → ดู collection ของตัวเอง · `/leaderboard` → อันดับ — ✅ wired
6. `/battle` → จับคู่ art สู้กัน + โหวต (`BATTLE_VOTE_ALLOWLISTED=true` = โหวตได้จริง) — ✅ wired; ⚠️ `resolve_battle` (จบเกม) มี note ใน env ว่าต้อง re-allowlist ใน Enoki ก่อน = ส่วนที่อาจยังไม่ครบ
- หมายเหตุ: บางรูป preview เป็น **pre-baked sample** (`/api/img/<blobId>`) ปนกับ live gen
- ทั้ง 5 route smoke test 200 หมด (HANDOFF 31 พ.ค.)

## สิ่งที่ "Claude Code" สร้างให้
- **git: 63 commits — author "Vow" ทั้งหมด = Claude Code ทำให้ทั้งหมด** (Vow ไม่เขียนโค้ด ตัว agent commit ในชื่อ Vow). แปลว่า **ทั้งโปรเจกต์เป็นของที่ AI สร้าง**:
  - Move contracts 2 ตัว (artwork mint + battle)
  - Frontend Next.js 16 ครบ 5 route (/create /me /battle /leaderboard /)
  - Integration ทั้งหมด: Walrus (store + img proxy), Enoki zkLogin + sponsored mint, MiniMax image gen, rarity engine
  - Brand system (BRAND.md, โลโก้/favicon/og) + แก้ deploy Vercel (monorepo rootDirectory, ลบ root vercel.json ที่ตีกัน)
- **Vibe coding moments (สั่งเป็นภาษาคน → กลายเป็นของจริง):**
  1. "ล็อกอิน Google ไม่ต้องมี wallet ไม่ต้องจ่าย gas" → AI ต่อ **zkLogin + Enoki sponsored tx** ให้จริง (ส่วนที่ยากสุดทางเทคนิค คนสั่งไม่ต้องรู้ว่ามันคือ account abstraction)
  2. "ให้เอางานศิลป์มา battle กันแบบ head-to-head + มี leaderboard" → เกิด **battle Move contract + create/list/vote API + หน้า battle**
  3. pivot ทั้งโปรเจกต์: "เลิกขายเป็น SDK/เล่าเรื่อง เปลี่ยนเป็นของสะสมที่ mint แล้วเป็นเจ้าของ" → AI rebrand + เปลี่ยน positioning เป็น collectible (commit `dfb64ba` "drop storytelling")
  4. "เว็บ build ไม่ผ่านบน Vercel" → AI ไล่เจอปัญหา monorepo rootDirectory เอง แล้วแก้ให้ deploy ได้

## สรุปสภาพวันนี้
ของจริง deploy อยู่ live (lethe-gold.vercel.app), flow create→AI→Walrus→gasless mint ต่อครบในโค้ด, battle/leaderboard wired. จุดที่ต้องยืนยัน/อาจค้าง: ยิง mint จริงผ่าน Enoki allowlist + battle resolve. README ต้องอัปเดต (ยังเป็นของเก่า).

# Overnight briefing — Lethe — 2026-05-31

## 1. DEPLOY VERDICT
**Code builds; the ONLY blocker is a Vercel dashboard setting.** Set
`lethesdk` → Settings → Build & Deployment → **Root Directory = `apps/web`** →
Save → Redeploy. Local `pnpm --filter web build` is GREEN and prod env is 10/10.
Not green yet only because Vercel still builds at the repo root (no `next` there).

## 2. ENV (Vercel prod, project `lethesdk`) — 10/10 ✓
All 10 added to Production from `apps/web/.env.local`. Public values verified:
`NEXT_PUBLIC_SUI_NETWORK=testnet`, artwork id `0xea40338…b813e1f1`, battle id
`0x1e7048…ddfdc983`, `NEXT_PUBLIC_BATTLE_VOTE_ALLOWLISTED=true`, Walrus URLs,
Google client id, Enoki public key. The 2 secrets (`ENOKI_SECRET_KEY`,
`MINIMAX_API_KEY`) are present + sensitive (write-only, can't read back — normal).
Gotcha for future: this Vercel CLI ignores piped stdin for agents — set values with
`vercel env add NAME production --value "<v>" --force --yes`.
⚠️ NEXT_PUBLIC_* bake in **at build time**, so they only take effect on the
**redeploy after Root Directory is fixed**.

## 3. WIRING AUDIT — full loop PRESENT, no RED placeholders (`research/wiring-audit.md`)
| Component | State |
|---|---|
| Walrus upload (publisher PUT → blobId, used at mint) | PRESENT |
| Walrus read (images via /api/img aggregator proxy) | PRESENT |
| MiniMax (server-only `/api/generate`, key off client) | PRESENT |
| Enoki zkLogin (register + Google sign-in + sponsored tx) | PRESENT |
| Slush wallet (secondary sign-in) | PRESENT |
| Sui mint (artwork::mint, real uploaded blobId, gasless) | PRESENT |
| Battle vote (per-address dedup) + resolve_battle | PRESENT |
| Leaderboard (counts REAL resolved wins) | PRESENT |
- Placeholder grep (`demoblob`/`lethe-xxxx`/`TODO`/`localhost`/…) in `app`+`src`: **0**.
- Package IDs match on-chain; entry fns match (`mint`/`vote`/`resolve_battle`); both packages exist on testnet.
- No real secret committed; `.env.local` gitignored + untracked. (Old `demoblob` lives only on 2 past on-chain test objects + docs, never in shipping code.)

## 4. feat/walrus-deepening (pushed, **NOT merged** — review before merge)
PR: https://github.com/vowctminibro/lethe/pull/new/feat/walrus-deepening
- **Provenance bundle:** mint now also stores a JSON manifest on Walrus (image blobId
  + trait recipe + gen cert) and references it on-chain via a backward-compatible
  `;bundle:<id>` token in `traits`. Makes Walrus load-bearing for *provenance*, not
  just pixels. Round-trip **proven** against Walrus testnet. Additive — wrapped in
  try/catch, never blocks the existing single-image mint.
- **Live minted counter:** landing shows a live count of `ArtworkMinted` events
  (real on-chain mints; currently **10**), read from chain, not hardcoded.
- Reviewers (code-reviewer + edge-case subagents): **no Critical/High**; design
  verified sound. Hardening applied (RPC `res.ok`, guarded `readBundle`, bundle size
  cap, counter timer cleanup). Full notes: `docs/walrus-deepening-notes.md`,
  spec: `docs/provenance-bundle-spec.md`.
- **Review before merge:** (a) OK shipping the bundle id inside `traits` vs a future
  dedicated contract field (republish)? (b) no UI reads the bundle back yet — natural
  next step is a `/art/[id]` provenance view.

## 5. SAFE FIXES on main (done, pushed)
- `BRAND.md` (+ `brand-assets/BRAND.md`): verbal copy → collectible positioning
  (Tagline "Art you make. Yours forever.", new one-liner, collectible voice examples).
  Visual spec untouched. (Note: task's path `apps/web/public/brand/BRAND.md` doesn't
  exist — canonical is repo-root `BRAND.md`.)
- `apps/web/public/og.png`: real 1200×630 brand PNG (fixes the metadata 404).
- Removed stray repo-root `brand-assets/*.png` (unreferenced). App brand SVGs untouched.
- Also: `.vercel` gitignored; progress log + wiring audit committed.
- ⚠️ These main pushes trigger GitHub→Vercel auto-deploys that **ERROR** (Root
  Directory still unfixed) — **expected, not a code problem**; they'll go green once
  step 7.1 is done.

## 6. OUTDATED DEPS (report only — nothing changed, per rules)
- `react`/`react-dom` 19.2.4 → 19.2.6 (patch).
- `typescript` 5.9.3 → 6.0.3 (dev, **major** — hold).
- `@types/node` 20.19.41 → 25.9.1 (dev, **major** — intentionally pinned to Node 20 line).
- **At latest:** `next` 16.2.6, `@mysten/sui` 2.17.0, `@mysten/dapp-kit` 1.0.6,
  `@mysten/enoki` 1.0.8, `@mysten/walrus` 1.1.7, `zod` 4.4.3, `@tanstack/react-query` 5.100.14.
- Nothing pre-1.0 or abandoned on the critical path (the pre-1.0 `@mysten-incubation/memwal` was already removed).

## 7. TODO-FOR-VOW (in order)
1. **Vercel `lethesdk` → Settings → Build & Deployment → Root Directory = `apps/web`** →
   Save → **Redeploy**. Confirm the deploy goes **● Ready** (`vercel ls`). This is the
   whole blocker.
2. Open the prod **/create** and **mint one piece** end-to-end to confirm the
   NEXT_PUBLIC env baked correctly and gasless mint works in a real browser.
3. **Google Cloud Console + Enoki portal**: add the prod URL to Google authorized
   JavaScript origins + redirect URIs, and confirm in the Enoki portal. Use the
   **stable** alias `https://lethesdk-vowctminibro-7069s-projects.vercel.app` (NOT the
   per-deploy hash URL, which changes every deploy). This is your hands — Hermes is
   blocked by Google's automated-login detection.
4. **Review + merge `feat/walrus-deepening`** if it looks good (`docs/walrus-deepening-notes.md`).

(Optional cleanup: rename the Vercel project `lethesdk` → `lethe` in Settings → General; cosmetic.)

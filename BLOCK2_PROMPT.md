LETHE BLOCK 2 — SHIP TO PRODUCTION

CONTEXT: Mega-block 1 complete (all phases verified, fallback=ManualProvider, B16 logged).
Verified externally just now: https://lethe-gold.vercel.app still serves the OLD art app
(title "Lethe — AI art collectibles on Sui") → git push did NOT auto-deploy.
This block ends with lethe-gold serving the NEW app, externally verified. No new features.
Confirmed via npm registry: @mysten/memwal latest is still 0.0.2 → FALLBACK stays. Do not retry MemWal.
Quality bar, global rules, commit/push-per-step, PROGRESS.md/BLOCKERS.md discipline:
same as MEGA-BLOCK 1.

STEP 1 — LLM PROVIDER CHAIN (~45 min)
Chat+extraction currently run on NVIDIA NIM only while MINIMAX_API_KEY (paid) sits unused.
Investigate why. Unless MiniMax is genuinely broken (put evidence in BLOCKERS.md),
implement provider chain: MiniMax primary → NIM fallback, for BOTH chat streaming and
memory extraction, with per-request failover (timeout/5xx/429 → next provider, logged).
Re-run hero-e2e.mjs through the chain. GATE: e2e passes; chain failover unit-tested
(mock a MiniMax failure → NIM serves).

STEP 2 — BRAND v2 + METADATA + OG IMAGE (~45 min)
a) Replace the verbal identity section of BRAND.md with EXACTLY this copy:
   ---
   Lethe — Named after the river of forgetting. Built so nothing is.
   Tagline: "Memory you own."
   One-liner: Lethe is user-owned memory for AI agents — stored on Walrus, anchored
   on Sui, portable across every app.
   Problem: Every AI agent you talk to locks what it learns about you inside someone
   else's server — switch apps, start from zero.
   Solution: Lethe writes your agent's memory to Walrus as objects you own: any agent
   you authorize knows you instantly, every entry is verifiable on-chain, and revoking
   access makes it forget — live.
   Closing lines: "Lethe is the wedge." / "Memory infrastructure for the agentic web —
   a 10-year category." / "Built solo. Live on testnet today."
   Walrus integration note: encrypted memory blobs (AES-256-GCM, HKDF per owner) on
   Walrus; on-chain BlobRefs in an owned MemoryVault on Sui. MemWal integration attempted
   day-5 post-launch; blocked by SDK/relayer version gap (BLOCKERS.md B16); provider
   abstraction in place to adopt @mysten/memwal the day ≥0.0.4 publishes.
   ---
b) Update Next.js metadata app-wide: title "Lethe — Memory you own", description =
   one-liner above, OpenGraph + Twitter card pointing to /og.png. Kill every remaining
   "AI art collectibles" string in metadata/landing copy (grep to be sure).
c) Generate og.png 1200x630 programmatically (satori, or sharp+svg — whichever installs
   clean): Fog #EFF5F4 background, Ink #1A3A4A serif headline "Memory you own.",
   subline "User-owned AI memory on Walrus + Sui" in Mist #5A8A9E, Coral #E8B894 accent
   element, italic-serif L mark feel. Save to apps/web/public/og.png. VIEW the PNG
   yourself; if spacing/contrast reads cheap, iterate once. GATE: og.png exists, <300KB,
   looks intentional.

STEP 3 — VISUAL PASS, 4 SURFACES (~1-1.5 hr)
pnpm dev on :3010 with NEXT_PUBLIC_DEMO_MOCK=1 → Playwright screenshots:
landing, /chat (mid-stream + memory-chip moment), /memory, /pulse (granted state AND
revoked state) at 1440x900 and 390x844. VIEW every screenshot. Fix what reads cheap:
spacing, type hierarchy, empty states, mobile overflow, button alignment. Minimum 1 full
fix round, then re-shoot. Save final set to design/screens/. GATE: you would honestly
ship each screen as a funded product.

STEP 4 — VERCEL ENV SYNC
Locate the Vercel link (.vercel/project.json — repo root or apps/web). Diff env names the
code requires (grep process.env + NEXT_PUBLIC_ across apps/web) vs npx vercel env ls.
Add every missing name (at minimum the new memory package id var) to production, preview,
AND development via: printf '%s' "$VALUE" | npx vercel env add NAME <environment>
NEVER print secret values to stdout/report — names only. GATE: zero missing names.

STEP 5 — DEPLOY + EXTERNAL VERIFY (Build ≠ Ship)
Deploy with npx vercel --prod from the linked location. Do NOT delete/reimport the
project, do NOT change dashboard settings. Then verify against the REAL public URL:
- curl -s https://lethe-gold.vercel.app | grep -c "Memory you own" → ≥1
  (and grep "art collectibles" → 0)
- /chat /memory /pulse all return HTTP 200
- /og.png returns 200 with image/png content-type
- Playwright against prod (unauthed): landing renders, zero console errors, sign-in
  button visible; screenshots desktop+mobile → design/screens/prod/
If the alias still serves the old deployment, fix with vercel alias/inspect and document
exactly what you did. GATE: all checks green from the public URL, not localhost.

STEP 6 — print exactly:
=== LETHE BLOCK 2 REPORT ===
LLM chain: <MiniMax verdict + evidence | failover test result>
Brand/OG: <og.png path + size | stale strings removed count>
Visual pass: <issues fixed | screenshot dir>
Env sync: <names added (no values)>
Deploy: <deployment URL | alias OK? | route statuses | og.png status>
Prod screenshots: <paths>
Blockers: <list or none>
Recommended next: <your call>
=== END REPORT ===
Append to PROGRESS.md, commit, push.
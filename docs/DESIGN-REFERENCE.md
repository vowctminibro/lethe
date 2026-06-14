# DESIGN-REFERENCE.md — Lethe Landing Rebuild
> Build-ready reference extracted from 10 production sites. For Claude Code.
> Lethe = user-owned AI memory (derive memory from on-chain behavior, Seal-encrypted on Walrus, portable/revocable across apps). NOT a publishing platform.

---

## 1. TEXT-DENSITY TECHNIQUES

### 1A. Label + One-Sentence (Linear FIG system)
- **Pattern:** Each feature = a short label (2–4 words) + one sentence. No paragraphs. Group under numbered sections.
- **Sites:** Linear (FIG 0.2, 0.3…), Raycast (Fast / Ergonomic / Native / Reliable)
- **Before → After for Lethe:**
  - ❌ "Lethe derives a persistent memory profile from your on-chain behavior — transactions, token holds, governance votes, social graph — and Seal-encrypts it on Walrus so only you control who sees what."
  - ✅ **On-chain memory derivation** — Your wallet activity becomes a portable memory profile. Sealed on Walrus. Yours to revoke.

### 1B. Binary Split (Anuma pattern)
- **Pattern:** Pair two contrasting states in a single visual row. Each gets a heading + one sentence + screenshot.
- **Sites:** Anuma ("Power when you want it / Privacy when you need it"), Venice (Anonymized vs Private vs TEE vs E2E)
- **Before → After for Lethe:**
  - ❌ Long paragraph explaining the difference between public and private memory modes.
  - ✅ **Your memory. Your rules.**
    Left card: **Shareable** — Apps request access. You approve per-scope.
    Right card: **Sealed** — Encrypted on Walrus. Not even Lethe can read it.

### 1C. Stat Replacing a Sentence (Stripe/Vercel/Privy)
- **Pattern:** One oversized number + a 3-word label. Replaces an entire trust paragraph.
- **Sites:** Stripe (135+, US$1.9tn, 99.999%), Vercel (7m→40s builds), Privy (120M+ accounts), Pinata (600,000 developers)
- **Before → After for Lethe:**
  - ❌ "Lethe is trusted by a growing community of users who have created thousands of persistent memory profiles across multiple chains."
  - ✅ **12,000+** memories sealed · **4 chains** supported · **0** data breaches

### 1D. Product-Shot-Instead-of-Prose (Raycast/Linear)
- **Pattern:** Full-width product UI screenshot as the hero visual. Text sits above; the screenshot proves the claim.
- **Sites:** Linear (full app UI in hero), Raycast (clipboard history demo), Resend (live code + HTTP 200)
- **Before → After for Lethe:**
  - ❌ Three paragraphs describing the memory dashboard, the privacy controls, the app connections.
  - ✅ Hero text: "Your AI memory, everywhere." Below it: a single wide screenshot of the Lethe dashboard showing a memory profile with connected apps, privacy toggles, and an activity timeline.

---

## 2. PRICING-PAGE PATTERNS

### 2A. Card Grid + Comparison Table
- **Pattern:** 3–4 tier cards at the top (scannable in 5 seconds) + a detailed comparison table below (for analytical buyers).
- **Sites:** Venice, Linear, Mem0, Resend, Vercel
- **Annotated screenshots:** `ref-screenshots/01-venice-pricing.png`, `ref-screenshots/02-mem0-pricing.png`, `ref-screenshots/03-linear-pricing.png`
- **Key detail:** Venice puts the cards in a 2×2 grid. Linear uses 4 columns in a row. Mem0 uses a single horizontal grid with a highlighted "recommended" column. All three follow with a full comparison table below.

### 2B. Credit Legibility (Venice pattern)
- **Pattern:** Explain the credit system in one line near the pricing cards. "100 credits = $1" — users instantly know what they're spending.
- **Site:** Venice ("What are Credits?" section with 3 use-case icons: video, images, API)
- **For Lethe:** "1 memory derivation = 1 credit. 1 Seal-encrypt on Walrus = 5 credits. 100 credits = $2."

### 2C. "Most Popular" Highlight Placement
- **Pattern:** The recommended tier gets: a colored background (Venice: beige, Mem0: light purple), a "MOST POPULAR" or "Recommended" label, and a heavier CTA button (filled vs outlined).
- **Sites:** Venice (Pro+ at $68), Mem0 (Growth at $79), Vercel (Pro at $20), Pinata (Picnic at $20)
- **Rule:** Never highlight the cheapest paid tier. Highlight the one with the best value-per-dollar jump (usually tier 2 of 4, or tier 2 of 3).

### 2D. Monthly/Annual Toggle
- **Pattern:** A pill toggle at the top of the pricing section. Annual shows a "Save X%" badge.
- **Sites:** Venice (Save 10%), Anuma (Save 20%), Raycast (Save 20%), Resend (all tiers)
- **Convention:** Yearly is the default (checkbox checked or toggle switched to annual).

### 2E. Making the Tier Jump Feel Worth It
- **Pattern:** Each tier card says "Everything in [lower tier], plus:" then lists 3–5 additions. The additions are framed as unlocks, not just limits going up.
- **Sites:** Linear ("All Free features + 5 teams, unlimited issues, admin roles"), Venice (Pro→Pro+: 100→7,500 credits, 2-month rollover)
- **For Lethe tiers:**
  - Free → Creator: Unlock Seal-encryption, multi-chain memory, app connections
  - Creator → Studio: Unlimited derivations, API access, team memory spaces, priority Walrus pinning

---

## 3. SITES TO EMULATE

### 3A. RESEND — Primary Visual Reference
- **Borrow:** Serif headlines on dark background (matches Fraunces + Fog/Ink palette). Editorial feel without looking like a SaaS template. Glassmorphism icons with subtle glow. "Email for developers" simplicity → "Your memory, everywhere" or "AI memory that follows you."
- **Do NOT borrow:** The "Send test email" interactive widget (consumer users won't test an API). The 13-language SDK tab bar (Lethe isn't a dev tool — keep SDK docs separate).
- **Screenshot:** `ref-screenshots/04-resend-hero.png`

### 3B. VENICE AI — Credits + Privacy Model
- **Borrow:** The credits system ("100 credits = $1"), the privacy-first messaging ("your conversations remain yours alone"), and the card-grid pricing with a comparison table below. The "What are Credits?" section with 3 icons.
- **Do NOT borrow:** The interactive chat-input hero (Lethe is consumer-first, not a chatbot). The token/crypto branding (VVV, DIEM) — Lethe should feel like memory infra, not a token project.
- **Screenshots:** `ref-screenshots/05-venice-hero.png`, `ref-screenshots/01-venice-pricing.png`

### 3C. LINEAR — Cleanest Pricing Table
- **Borrow:** The "All Free features + [list]" additive pattern. The 4-column card layout with per-tier yearly toggle checkboxes. The comparison table organized by category (Core, AI, Security, Support).
- **Do NOT borrow:** The dark-engineering aesthetic (too dev-focused for Lethe's literary tone). The numbered FIG system in the landing page (feels like Jira docs).
- **Screenshot:** `ref-screenshots/03-linear-pricing.png`

---

## 4. ANTI-PATTERNS (What Would Make Lethe Look Templated)

### 4A. Code-Snippet-as-Hero
- ❌ Resend, Mem0, and Pinata put code snippets in the hero. This works for dev tools. Lethe is a consumer-first memory product — code belongs in /docs/sdk, not on the landing.
- ✅ Use a product screenshot or interactive widget instead.

### 4B. AI-Artwork / Stock Illustration
- ❌ Generic neural-network visuals, glowing brain icons, or Midjourney-style "AI art" as hero imagery. Instantly signals "template."
- ✅ Use real product UI screenshots, data-flow diagrams, or abstract geometric elements that match the Fog/Ink palette.

### 4C. Gradient-Glassmorphism Overload
- ❌ Purple-to-pink gradients, glass-effect cards everywhere, neon glow on every icon. This is the "2024 AI startup default."
- ✅ Reserve glow/glass for ONE element (e.g., the hero icon or a single CTA). Keep the rest clean and editorial.

### 4D. The Three AI-Default Looks (Avoid All Three)
1. **Cream + serif + terracotta** — Looks like every "AI for creators" template (Jasper, Copy.ai era).
2. **Black + acid accent** — Looks like every dev tool (Vercel, Linear clones). Too engineering for Lethe.
3. **Broadsheet hairline everywhere** — Using Fraunces hairline for every heading AND body AND labels. Overuse kills the editorial feel. Use Fraunces for the hero headline and section titles only. Use a clean sans-serif (Inter, Geist) for body and UI.

### 4E. Other Anti-Patterns
- ❌ "Trusted by" logo wall with 15+ logos when you have 3 real users — use a stat number instead.
- ❌ Pricing table with 6+ tiers — too many choices. 3–4 is the sweet spot.
- ❌ "Talk to sales" as the only paid option — users want self-serve.
- ❌ Long feature paragraphs on the landing page — if it's more than 2 sentences, it's too long.

---

## PALETTE & TYPOGRAPHY QUICK-REF
- **Fog:** #EFF5F4 (background)
- **Ink:** #1A3A4A (primary text)
- **Fraunces:** serif, for hero headlines and section titles ONLY
- **Body/UI font:** Inter or Geist, clean sans-serif
- **Accent:** one warm tone (amber or copper) for CTAs and highlights. Not neon. Not gradient.

---

## HOW TO USE THIS FILE

Open this file and the 6 reference screenshots in `ref-screenshots/` before writing any landing-page code. The techniques in §1 replace paragraph walls — use them for every section. The pricing patterns in §2 should structure the `/pricing` page. The emulation notes in §3 tell you what to borrow (and what to skip) from each reference site. The anti-patterns in §4 are hard constraints — if you're about to write something that matches any of them, stop and pick a different approach. The palette above is the Lethe brand — do not introduce colors or fonts outside it without asking.

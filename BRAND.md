# Lethe Brand System

**Locked:** 2026-05-28 · verbal identity v2: 2026-06-10
**Version:** 2.0

---

## Identity

Lethe — Named after the river of forgetting. Built so nothing is.

- **Tagline:** "Memory you own."
- **One-liner:** Lethe is user-owned memory for AI agents — derived from your real on-chain life, Seal-encrypted end-to-end on Walrus, anchored on Sui, portable across every app.
- **Problem:** Every AI agent you talk to locks what it learns about you inside someone else's server — switch apps, start from zero.
- **Solution:** Lethe writes your agent's memory to Walrus as objects you own — encrypted in your browser with Seal threshold encryption, derived from what you say AND what your wallet has actually done. Any agent you authorize knows you instantly, every entry is verifiable on-chain, and revoking access makes it forget — live, enforced by the key servers (machine-proven, 19/19).
- **Closing lines:** "Lethe is the wedge." / "Memory infrastructure for the agentic web — a 10-year category." / "Built solo. Live on testnet today."
- **Walrus integration note:** encrypted memory blobs (AES-256-GCM, HKDF per owner) on Walrus; on-chain BlobRefs in an owned MemoryVault on Sui. MemWal integration attempted day-5 post-launch; blocked by SDK/relayer version gap (BLOCKERS.md B16); provider abstraction in place to adopt @mysten/memwal the day ≥0.0.4 publishes.
- **Encryption honesty rule (copy guardrail, updated Block 8):** "even Lethe's servers can't read your memories" is now TRUE for Seal-mode entries and safe to use. Keep two disclosures wherever depth allows: (1) pre-Seal legacy entries used server-side AES until re-written; (2) third-party apps read via the server-mediated grant gate until the shared-registry policy ships (B17). Never claim independent app decrypt sessions exist today.
- **Memory economics (deck line):** today each fact is a sponsored Walrus blob; Walrus prices storage at a fixed $0.023/GB/month (~5× erasure coding; sub-10MB blobs are dominated by fixed per-blob metadata — our exact shape). Designed (not yet built): batch facts via Walrus Quilt — per-patch IDs keep individual recall, amortized overhead makes a lifetime of memories pennies per month. Roadmap: vault-funded renewal — your WAL, your memory, your call to extend or expire. Source: docs.wal.app/docs/system-overview/storage-costs

---

## Logo Mark — Monogram

A serif italic **L** inside a circle, with a small accent dot suggesting an ink mark from the author's pen. The dot is the distinctive element — it makes the mark ownable.

### Mark variants

| Variant | Use | Mark color | L color | Dot color |
|---------|-----|-----------|---------|-----------|
| Light | Landing, marketing, light bg | Ink `#1A3A4A` | Fog `#EFF5F4` | Coral `#E8B894` |
| Dark | Product UI, dark bg | Parchment `#E8DFD0` | Midnight `#0A1628` | Candle `#D4A574` |
| Favicon | Browser tab, OS icons | Ink `#1A3A4A` | Fog `#EFF5F4` | Coral `#E8B894` |

### Mark construction
- Circle radius: 42 units (in 100×100 viewBox)
- Letter L: Georgia italic, size 42, anchored center
- Dot position: x=73, y=58, radius=4
- Favicon variant: larger radius (46), larger dot (5) for visibility at small sizes

---

## Colors

### Light Mode — landing, marketing surfaces

```
Ink          #1A3A4A    text, primary, dark surfaces
Mist         #5A8A9E    secondary text, links
Coral        #E8B894    accents, CTAs, highlights
Fog          #EFF5F4    background, surfaces
```

### Dark Mode — product, story reader

```
Midnight     #0A1628    background, primary dark
Parchment    #E8DFD0    body text, surfaces
Moonlight    #6B9BD1    secondary text, links
Candle       #D4A574    accents, CTAs, highlights
```

### Strategic rationale
- Light mode aligns with Sui blue family (ecosystem fit)
- Dark mode evokes a candlelit library (storytelling atmosphere)
- Coral/Candle warm accents differentiate Lethe from other Sui projects (most use cool blue throughout)

---

## Typography

> **SUPERSEDED by Visual identity v3 (bottom of this file):** body = Instrument Sans, mono = IBM Plex Mono. Fraunces stays. The blocks below are kept for v2 history.

### Display — Fraunces

Variable serif from Google Fonts. Optical sizing. Use for headlines, marks, story chapters.

```
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&display=swap');
```

### Body — Inter

Variable sans-serif from Google Fonts. Use for body text, UI, navigation.

```
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
```

### Code — JetBrains Mono

For code snippets only.

```
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
```

---

## Voice & Tone

- **Sentence case** always (never Title Case, never ALL CAPS)
- **Literary register** — warm, confident, never crypto-bro slang
- **English default**, Thai secondary
- **No emoji** in product copy
- **Lethe** capitalized; "lethe" lowercase only in wordmark glyph

### On-brand examples
- ✅ "Memory you own."
- ✅ "Any agent you authorize knows you instantly."
- ✅ "Revoke access and it forgets — live."
- ✅ "Sign in with Google."

### Off-brand examples
- ❌ "🔥 Mint your NFT now!"
- ❌ "Built on Sui Blockchain Powered by AI"
- ❌ "gm storytellers wagmi 🚀"

---

## Tailwind Tokens

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Light mode
        ink: '#1A3A4A',
        mist: '#5A8A9E',
        coral: '#E8B894',
        fog: '#EFF5F4',
        // Dark mode
        midnight: '#0A1628',
        parchment: '#E8DFD0',
        moonlight: '#6B9BD1',
        candle: '#D4A574',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

---

## Asset Files

| File | Purpose |
|------|---------|
| `lethe-mark-light.svg` | Primary mark, light mode |
| `lethe-mark-dark.svg` | Primary mark, dark mode |
| `lethe-favicon.svg` | Browser tab + OS, optimized for small sizes |
| `lethe-lockup.svg` | Mark + wordmark horizontal, for headers |

All assets exported from this spec. Source of truth: `BRAND.md` + SVG files in `apps/web/public/brand/`.

---

## Visual identity v3 — "Letterpress on water" (locked 2026-06-11, Block 6)

One art direction, every pixel obeys. NO new colors, NO gradients, NO stock rounded-card layouts.

### Type
- **Display:** Fraunces variable (italic + optical sizing, 400–600). Landing display 48–72px italic, set as verse — line breaks follow the poem, never the viewport. Section heads 28–36 upright.
- **Body:** Instrument Sans 15.5/1.6.
- **Mono:** IBM Plex Mono for EVERY on-chain id/hash — 12.5px, +0.08em tracking (`.lethe-id`). Ids are engraved plates with a copy affordance, never plain inline text.

### Shape & surface
- Corners 2–4px everywhere (the Tailwind radius scale is overridden in `globals.css` — `rounded-*` utilities all map to 2–4px).
- Borders: hairline `rgba(26,58,74,.12)` (`--border`, `.lethe-hairline`). Shadows: hairline + faint ambient only (`--shadow-ambient`).
- Confirmed memory chips: letterpress inset (`.lethe-letterpress`, ink-pool variant inline in MemoryRail).

### Color law (hard rule)
- Fog `#EFF5F4` = paper. Ink `#1A3A4A` = text. Mist `#5A8A9E` = secondary.
- **Coral `#E8B894` is RESERVED for memory: memory events/chips, proof links (Walrus/Suiscan), remembrance actions (Save/grant/forget accents), selection + focus rings.** Coral on anything unrelated to memory is a bug — remove it.
- The memory rail in /chat is the ONE dark surface on a paper page (the ink pool, `#1A3A4A`).

### Water line-work
- Contour-line SVG pattern, Mist at ≤6% opacity, drifting 75–90s (`.lethe-water`, `.lethe-divider`). Hero + section dividers ONLY. No gradients anywhere. `prefers-reduced-motion` kills all drift/motion globally.

### Motion vocabulary (400–600ms, ease-out)
- `.lethe-chip-lift` — fact lifts from the conversation with a soft coral glow.
- `.lethe-stamp` — chip anchors on on-chain confirm (one stamp, then letterpress).
- `.lethe-inkwash` — forget: the ledger row blurs and washes off.
- `.lethe-draw` — vault birth: the L mark draws itself (1.5s rite, skippable).

### Voice anchors per surface
- Landing: verse hero ("Named after the river / of forgetting. / Built so nothing is.") + memory-constellation line-work + colophon footer.
- /chat: Lethe speaks as typeset prose with a hanging italic "L." — no bubble. User notes are ink. Rail = ink pool.
- /memory: MEMORY HUB constellation (grant/revoke ON the map, severing spokes) over an engraved ledger.
- /pulse: same press, different publication — Mist-led italic wordmark, its own display moment, "POWERED BY LETHE MEMORY" colophon.

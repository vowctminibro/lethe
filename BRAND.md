# Lethe Brand System

**Locked:** 2026-05-28
**Version:** 1.0

---

## Identity

- **Name:** Lethe
- **Tagline:** Your AI remembers you. The memory is yours.
- **One-liner:** Lethe is owned AI memory on Walrus — it learns your on-chain style and saves what it knows as encrypted Walrus blobs referenced by a Sui object you control: owned by you, verifiable, and portable across apps. Sign in with Google: no wallet, no gas.
- **Origin:** Λήθη — the river of forgetfulness in Greek myth. Lethe is its inverse: what an AI learns about you is remembered, owned by you, on-chain.

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
- ✅ "Art you make. Yours forever."
- ✅ "Create your collectible."
- ✅ "Mint it. Own it. Battle it."
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

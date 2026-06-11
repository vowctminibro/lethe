// Generates public/og.png (1200x630) from an inline SVG via sharp.
// Brand: Fog bg, Ink serif headline, Mist subline, Coral accents, italic-serif
// L mark per BRAND.md. Run from apps/web: node scripts/generate-og.mjs
import sharp from "sharp";
import { writeFileSync, statSync } from "node:fs";

const W = 1200;
const H = 630;

const INK = "#1A3A4A";
const MIST = "#5A8A9E";
const CORAL = "#E8B894";
const FOG = "#EFF5F4";

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${FOG}"/>

  <!-- water line-work: contour lines, Mist at 6% — the river under everything -->
  <g fill="none" stroke="${MIST}" stroke-width="1" opacity="0.06">
    <path d="M0 90 C 200 60, 400 120, 600 90 S 1000 60, 1200 90"/>
    <path d="M0 170 C 200 140, 400 200, 600 170 S 1000 140, 1200 170"/>
    <path d="M0 250 C 200 220, 400 280, 600 250 S 1000 220, 1200 250"/>
    <path d="M0 330 C 200 300, 400 360, 600 330 S 1000 300, 1200 330"/>
    <path d="M0 410 C 200 380, 400 440, 600 410 S 1000 380, 1200 410"/>
    <path d="M0 490 C 200 460, 400 520, 600 490 S 1000 460, 1200 490"/>
    <path d="M0 570 C 200 540, 400 600, 600 570 S 1000 540, 1200 570"/>
  </g>

  <!-- oversized ghost L, bleeding off the right edge — quiet texture, not clipart -->
  <text x="1065" y="540" font-family="Georgia, serif" font-style="italic" font-size="760"
        fill="${INK}" opacity="0.05">L</text>
  <circle cx="1158" cy="500" r="36" fill="${CORAL}" opacity="0.30"/>

  <!-- the mark: Ink circle, Fog italic L, Coral ink-dot -->
  <g transform="translate(96, 88)">
    <circle cx="42" cy="42" r="42" fill="${INK}"/>
    <text x="42" y="54" font-family="Georgia, serif" font-size="42" fill="${FOG}"
          text-anchor="middle" font-style="italic">L</text>
    <circle cx="65" cy="49" r="4" fill="${CORAL}"/>
    <text x="106" y="56" font-family="Georgia, serif" font-style="italic" font-size="34"
          fill="${INK}">Lethe</text>
  </g>

  <!-- verse -->
  <text x="96" y="312" font-family="Georgia, serif" font-style="italic" font-size="56"
        fill="${MIST}">Named after the river of forgetting.</text>
  <!-- headline -->
  <text x="96" y="424" font-family="Georgia, serif" font-size="96"
        fill="${INK}" letter-spacing="-1" font-weight="500">Built so nothing is.</text>
  <!-- coral ink-stroke under "nothing" -->
  <rect x="416" y="446" width="290" height="7" rx="3" fill="${CORAL}"/>

  <!-- subline -->
  <text x="96" y="492" font-family="'Helvetica Neue', Arial, sans-serif" font-size="30"
        fill="${MIST}">Memory you own — on Walrus, anchored on Sui, portable across every app</text>

  <!-- footer rail -->
  <rect x="96" y="524" width="44" height="3" rx="1.5" fill="${CORAL}"/>
  <text x="158" y="534" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22"
        fill="${MIST}" opacity="0.85">lethe-gold.vercel.app · live on Sui testnet</text>
</svg>`;

const png = await sharp(Buffer.from(svg), { density: 144 })
  .resize(W, H)
  .png({ compressionLevel: 9, palette: true })
  .toBuffer();

writeFileSync(new URL("../public/og.png", import.meta.url), png);
const kb = (statSync(new URL("../public/og.png", import.meta.url)).size / 1024).toFixed(1);
console.log(`og.png written — ${kb} KB (${W}x${H})`);

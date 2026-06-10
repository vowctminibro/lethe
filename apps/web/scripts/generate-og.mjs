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

  <!-- headline -->
  <text x="96" y="368" font-family="Georgia, serif" font-style="italic" font-size="104"
        fill="${INK}" letter-spacing="-1">Memory you own.</text>
  <!-- coral ink-stroke under "own" -->
  <rect x="652" y="392" width="222" height="7" rx="3.5" fill="${CORAL}"/>

  <!-- subline -->
  <text x="96" y="452" font-family="'Helvetica Neue', Arial, sans-serif" font-size="34"
        fill="${MIST}">User-owned AI memory on Walrus + Sui</text>

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

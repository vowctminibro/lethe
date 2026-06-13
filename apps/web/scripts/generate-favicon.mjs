// Generates the brand favicon set from the EXISTING monogram L mark
// (Ink circle, Fog italic L, Coral accent dot — see BRAND.md / app/icon.svg).
// No new art, no external assets. Run from apps/web: node scripts/generate-favicon.mjs
//   → app/favicon.ico        (PNG-in-ICO: 16 + 32 + 48, replaces the Next default)
//   → app/apple-icon.png     (180×180 Fog tile with the centered monogram)
import sharp from "sharp";
import { writeFileSync, statSync } from "node:fs";

const INK = "#1A3A4A";
const FOG = "#EFF5F4";
const CORAL = "#E8B894";

// The monogram, verbatim from app/icon.svg — Ink circle, Fog italic serif L,
// Coral ink-dot. Rendered at high density so the small sizes stay crisp.
const monogram = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="46" fill="${INK}"/>
  <text x="50" y="63" font-family="Georgia, 'Times New Roman', serif" font-size="48" fill="${FOG}" text-anchor="middle" font-style="italic" font-weight="400">L</text>
  <circle cx="76" cy="58" r="5" fill="${CORAL}"/>
</svg>`;

const renderPng = (size) =>
  sharp(Buffer.from(monogram(size)), { density: 384 }).resize(size, size).png().toBuffer();

// Minimal ICO encoder — PNG-compressed entries (supported by every modern
// browser + Windows Vista+). Header (6) + N dir entries (16 each) + PNG payloads.
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + 16 * images.length;
  for (let i = 0; i < images.length; i++) {
    const { size, buf } = images[i];
    const b = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, b + 0); // width  (0 = 256)
    dir.writeUInt8(size >= 256 ? 0 : size, b + 1); // height
    dir.writeUInt8(0, b + 2); // palette count
    dir.writeUInt8(0, b + 3); // reserved
    dir.writeUInt16LE(1, b + 4); // color planes
    dir.writeUInt16LE(32, b + 6); // bits per pixel
    dir.writeUInt32LE(buf.length, b + 8); // bytes in resource
    dir.writeUInt32LE(offset, b + 12); // offset from file start
    offset += buf.length;
  }
  return Buffer.concat([header, dir, ...images.map((i) => i.buf)]);
}

// favicon.ico — 16 / 32 / 48
const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(
  icoSizes.map(async (size) => ({ size, buf: await renderPng(size) })),
);
const icoPath = new URL("../app/favicon.ico", import.meta.url);
writeFileSync(icoPath, buildIco(icoImages));
console.log(`favicon.ico written — ${(statSync(icoPath).size / 1024).toFixed(1)} KB (${icoSizes.join("/")})`);

// apple-icon.png — 180×180 Fog tile, monogram centered (Apple rounds the square
// and ignores SVG apple-touch-icons, so this is a filled PNG).
const mono = await renderPng(152);
const apple = await sharp({ create: { width: 180, height: 180, channels: 4, background: FOG } })
  .composite([{ input: mono, gravity: "centre" }])
  .png()
  .toBuffer();
const applePath = new URL("../app/apple-icon.png", import.meta.url);
writeFileSync(applePath, apple);
console.log(`apple-icon.png written — ${(statSync(applePath).size / 1024).toFixed(1)} KB (180×180)`);

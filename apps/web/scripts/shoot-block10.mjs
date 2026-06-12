// Block 10 Phase 8 — full-page captures of landing + /docs/security at
// desktop + 390px. Usage: node scripts/shoot-block10.mjs <baseUrl> <outDir>
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "/opt/homebrew/lib/node_modules/playwright/index.mjs";

const BASE = process.argv[2] || "http://localhost:3010";
const OUT = path.resolve(import.meta.dirname, process.argv[3] || "../../../design/screens/block10");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
for (const vp of [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = "nextjs-portal { display: none !important; }";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  // overflow check: page must not scroll horizontally
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.screenshot({ path: path.join(OUT, `landing-${vp.tag}.png`), fullPage: true });

  await page.goto(`${BASE}/docs/security`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.screenshot({ path: path.join(OUT, `docs-security-${vp.tag}.png`), fullPage: true });

  console.log(`[${vp.tag}] landing overflow=${overflow}px · docs overflow=${overflow2}px · console errors=${errors.length}`);
  await ctx.close();
}
await browser.close();
console.log("written to", OUT);

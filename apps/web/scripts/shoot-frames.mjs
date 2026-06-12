// Block 10 Phase 2 — three REAL product frames for the landing, captured from
// DEMO_MOCK populated states (representative data only: trading-style facts,
// a few entries; nothing fabricated as real balances/counts).
// Dev server on :3010 with NEXT_PUBLIC_DEMO_MOCK=1. Run from apps/web:
//   node scripts/shoot-frames.mjs
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "/opt/homebrew/lib/node_modules/playwright/index.mjs";

const BASE = "http://localhost:3010";
const OUT = path.resolve(import.meta.dirname, "../public/screens");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
await ctx.addInitScript(() => {
  const style = document.createElement("style");
  style.textContent = "nextjs-portal { display: none !important; }";
  document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
});
const page = await ctx.newPage();

async function save(name, raw) {
  // ~1200 wide webp, quality tuned for hairline UI.
  await sharp(raw).resize(1200).webp({ quality: 84 }).toFile(path.join(OUT, `${name}.webp`));
  const { size } = await sharp(path.join(OUT, `${name}.webp`)).metadata().then(() => import("node:fs").then((fs) => fs.statSync(path.join(OUT, `${name}.webp`))));
  console.log(`${name}.webp — ${(size / 1024).toFixed(0)} KB`);
}

// (a) /chat — type a fact, catch it settling into the rail
await page.goto(`${BASE}/chat`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const input = page.getByPlaceholder("Tell Lethe about your crypto style…");
await input.fill("New rule: I size every position by volatility, never by conviction.");
await input.press("Enter");
try {
  await page.waitForSelector("text=writing…", { timeout: 30000 });
} catch {
  await page.waitForTimeout(4000);
}
await page.waitForTimeout(700); // chip lift animation mid-flight
await save("frame-chat", await page.screenshot());

// (b) /memory — ledger with entries + Import/Export visible
await page.goto(`${BASE}/memory`, { waitUntil: "networkidle" });
await page.waitForTimeout(1800);
await save("frame-memory", await page.screenshot());

// (c) /pulse — granted state with briefing
await page.goto(`${BASE}/pulse`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000); // briefing stream settles
await save("frame-pulse", await page.screenshot());

await browser.close();
console.log("frames written to", OUT);

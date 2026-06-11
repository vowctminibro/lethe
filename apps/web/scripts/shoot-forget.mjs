// Block 5 Step 3 — Forget interaction screenshots (mock mode, :3010).
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "/opt/homebrew/lib/node_modules/playwright/index.mjs";

const BASE = "http://localhost:3010";
const OUT = path.resolve(import.meta.dirname, "../../../design/screens/forget");
mkdirSync(OUT, { recursive: true });
const out = (n) => path.join(OUT, `${n}.png`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
ctx.on("page", (p) => p.on("console", (m) => m.type() === "error" && errors.push(m.text())));
await ctx.addInitScript(() => {
  const style = document.createElement("style");
  style.textContent = "nextjs-portal { display: none !important; }";
  document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
});

const page = await ctx.newPage();
await page.goto(`${BASE}/memory`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="memory-entry"]', { timeout: 15000 });
await page.screenshot({ path: out("1-entries-with-forget") });

await page.locator('[data-testid="forget-button"]').first().click();
await page.waitForSelector('[data-testid="forget-dialog"]');
await page.screenshot({ path: out("2-confirm-dialog") });

const before = await page.locator('[data-testid="memory-entry"]').count();
await page.locator('[data-testid="forget-confirm"]').click();
await page.waitForTimeout(1000); // mock forget = 800ms + row-out start
await page.screenshot({ path: out("3-row-out-toast") });
await page.waitForTimeout(1200);
const after = await page.locator('[data-testid="memory-entry"]').count();
await page.screenshot({ path: out("4-after-forget") });

console.log(`entries: ${before} -> ${after}`);
console.log(`console errors: ${errors.length}`, errors.slice(0, 3));
await browser.close();
if (after !== before - 1) { console.error("row did not leave"); process.exit(1); }
console.log("FORGET SHOTS OK →", OUT);

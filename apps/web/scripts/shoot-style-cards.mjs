// Block 5 Step 4 — wallet link → suggested trait cards → Save (mock auth, real RPC+LLM).
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "/opt/homebrew/lib/node_modules/playwright/index.mjs";

const BASE = "http://localhost:3010";
const WALLET = "0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077";
const OUT = path.resolve(import.meta.dirname, "../../../design/screens/style-depth");
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
await page.goto(`${BASE}/chat`, { waitUntil: "networkidle" });

// open the wallet-link input and link the test wallet
await page.getByText("Link a wallet", { exact: false }).first().click().catch(async () => {
  // fallback: the toggle may be labeled differently — find the placeholder directly
});
const input = page.getByPlaceholder("0x… wallet to link (read-only)");
if (!(await input.count())) {
  // toggle to open input
  const toggles = page.locator("button", { hasText: /link/i });
  await toggles.first().click();
}
await page.getByPlaceholder("0x… wallet to link (read-only)").fill(WALLET);
await page.keyboard.press("Enter");

await page.waitForSelector('[data-testid="suggestion-card"]', { timeout: 90000 });
await page.waitForTimeout(400);
await page.screenshot({ path: out("1-suggestion-cards") });

const cards = await page.locator('[data-testid="suggestion-card"]').count();
await page.locator('[data-testid="suggestion-save"]').first().click();
await page.waitForTimeout(1800); // mock remember 1200ms + confirm
await page.screenshot({ path: out("2-saved-one") });
const savedBadge = await page.getByText("saved ✓").count();

await page.locator('[data-testid="suggestion-dismiss"]').first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: out("3-after-dismiss") });
const remaining = await page.locator('[data-testid="suggestion-card"]').count();

console.log(`cards=${cards} savedBadge=${savedBadge} remaining=${remaining}`);
console.log(`console errors: ${errors.length}`, errors.slice(0, 3));
await browser.close();
if (cards < 2 || savedBadge < 1 || remaining !== cards - 1) { console.error("STYLE CARDS GATE FAILED"); process.exit(1); }
console.log("STYLE CARDS OK →", OUT);

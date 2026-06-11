// Block 5 Step 5 — route × state screenshot matrix.
// Usage: node scripts/shoot-states.mjs <tag>   (tag = authed | unauthed)
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "/opt/homebrew/lib/node_modules/playwright/index.mjs";

const BASE = "http://localhost:3010";
const TAG = process.argv[2] || "authed";
const OUT = path.resolve(import.meta.dirname, "../../../design/screens/states");
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ["landing", "/"],
  ["chat", "/chat"],
  ["memory", "/memory"],
  ["pulse", "/pulse"],
];

const browser = await chromium.launch();
const allErrors = {};
for (const vp of [{ tag: "desktop", width: 1440, height: 900 }, { tag: "mobile", width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = "nextjs-portal { display: none !important; }";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
  });
  for (const [name, route] of ROUTES) {
    const page = await ctx.newPage();
    const errs = [];
    page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, `${TAG}-${name}-${vp.tag}.png`) });
    if (errs.length) allErrors[`${TAG}-${name}-${vp.tag}`] = errs.slice(0, 2);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log("shots done:", TAG, "| console errors:", JSON.stringify(allErrors));

// Block 2 Step 5 — external verification shots against the REAL public URL
// (unauthed): landing renders, zero console errors, sign-in button visible.
// Usage: node scripts/shoot-prod.mjs
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "/opt/homebrew/lib/node_modules/playwright/index.mjs";

const BASE = "https://lethe-gold.vercel.app";
const OUT = path.resolve(import.meta.dirname, "../../../design/screens/prod");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let failed = false;

for (const vp of [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
  });
  const errors = [];
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  // Block 6 verse hero: h1 = "Named after the river of forgetting. Built so
  // nothing is."; the "Memory you own" tagline lives in body copy + <title>.
  const h1 = await page.locator("h1").first().textContent();
  const body = await page.locator("body").textContent();
  console.log(`[${vp.tag}] h1: ${h1?.trim().slice(0, 60)}`);
  if (!h1?.includes("river") || !body?.includes("Memory you own")) {
    console.error(`[${vp.tag}] FAIL: hero verse or tagline missing`);
    failed = true;
  }
  await page.screenshot({ path: path.join(OUT, `landing-${vp.tag}.png`), fullPage: true });

  // sign-in CTA visible unauthed (landing CTA leads into the flow; /chat shows Google sign-in)
  await page.goto(`${BASE}/chat`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const signIn = page.getByText(/sign in/i).first();
  const visible = await signIn.isVisible().catch(() => false);
  console.log(`[${vp.tag}] sign-in visible on /chat: ${visible}`);
  if (!visible) failed = true;
  await page.screenshot({ path: path.join(OUT, `chat-unauthed-${vp.tag}.png`) });

  console.log(`[${vp.tag}] console errors: ${errors.length}`);
  for (const e of errors.slice(0, 5)) console.log(`  err: ${e.slice(0, 200)}`);
  if (errors.length > 0) failed = true;
  await ctx.close();
}

await browser.close();
console.log(failed ? "PROD VERIFY: FAIL" : "PROD VERIFY: PASS");
process.exit(failed ? 1 : 0);

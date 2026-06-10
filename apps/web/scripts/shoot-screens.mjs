// Block 2 Step 3 — Playwright screenshot pass over the 4 surfaces.
// Dev server must be up on :3010 with NEXT_PUBLIC_DEMO_MOCK=1.
// Usage: node scripts/shoot-screens.mjs <outDir>
// Shots per viewport (desktop 1440x900, mobile 390x844):
//   landing, chat-midstream, chat-chip (memory-chip moment), memory,
//   pulse-granted, pulse-revoked
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "/opt/homebrew/lib/node_modules/playwright/index.mjs";

const BASE = "http://localhost:3010";
const OUT = process.argv[2] || "../../../design/screens";
mkdirSync(path.resolve(import.meta.dirname, OUT), { recursive: true });
const out = (name) => path.resolve(import.meta.dirname, OUT, `${name}.png`);

const VIEWPORTS = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
  });
  const errors = [];
  ctx.on("page", (p) =>
    p.on("console", (m) => m.type() === "error" && errors.push(m.text())),
  );
  // The Next dev-tools floating button is dev-only chrome — keep it out of shots.
  await ctx.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = "nextjs-portal { display: none !important; }";
    document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
  });

  // ── landing ──
  let page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: out(`landing-${vp.tag}`), fullPage: true });

  // ── chat: mid-stream, then the memory-chip moment ──
  await page.goto(`${BASE}/chat`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200); // rail seed settle
  const input = page.getByPlaceholder("Tell Lethe about your crypto style…");
  await input.fill("New rule for me: I only enter trades on weekends, never weekdays.");
  await input.press("Enter");
  // streaming cursor appears with the growing bubble → mid-stream moment
  try {
    await page.waitForSelector("span.animate-pulse", { timeout: 20000 });
    await page.waitForTimeout(250);
  } catch {
    console.warn(`[${vp.tag}] no mid-stream cursor caught (stream too fast?)`);
  }
  await page.screenshot({ path: out(`chat-midstream-${vp.tag}`) });
  // chip moment: pending chip says "writing…" in the rail (desktop only — rail hidden on mobile)
  try {
    await page.waitForSelector("text=writing…", { timeout: 30000 });
    await page.screenshot({ path: out(`chat-chip-${vp.tag}`) });
  } catch {
    // fall back to the settled state if extraction returned no fact
    await page.waitForTimeout(4000);
    await page.screenshot({ path: out(`chat-chip-${vp.tag}`) });
    console.warn(`[${vp.tag}] pending chip not seen — settled shot taken`);
  }

  // ── memory ──
  await page.goto(`${BASE}/memory`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out(`memory-${vp.tag}`), fullPage: true });

  // ── pulse: granted (mock default) — viewport shot; fullPage exaggerates the
  // empty space below the fold on a content-light page ──
  await page.goto(`${BASE}/pulse`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500); // briefing stream settle
  await page.screenshot({ path: out(`pulse-granted-${vp.tag}`) });

  // ── pulse: revoked (seed mock store with no grants) ──
  page = await ctx.newPage();
  await page.addInitScript(() => {
    window.sessionStorage.setItem(
      "lethe-demo-mock",
      JSON.stringify({ added: [], authorized: [] }),
    );
  });
  await page.goto(`${BASE}/pulse`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: out(`pulse-revoked-${vp.tag}`) });

  console.log(`[${vp.tag}] done — console errors: ${errors.length}`);
  for (const e of errors.slice(0, 5)) console.log(`  console.error: ${e.slice(0, 160)}`);
  await ctx.close();
}

await browser.close();
console.log("screenshots written to", path.resolve(import.meta.dirname, OUT));

// Print the console errors the block10 shooter counted.
import { chromium } from "/opt/homebrew/lib/node_modules/playwright/index.mjs";
const BASE = process.argv[2] || "http://localhost:3010";
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
page.on("console", (m) => m.type() === "error" && console.log("ERR:", m.text().slice(0, 300)));
page.on("pageerror", (e) => console.log("PAGEERR:", e.message.slice(0, 300)));
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await browser.close();
console.log("done");

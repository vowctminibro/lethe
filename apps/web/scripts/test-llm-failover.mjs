// CI gate: unit test for the LLM provider chain (Block 13 design).
// Mocks global fetch — NO network, NO real keys. Verifies:
//   • the CHAT chain is exactly Groq → Gemini → NVIDIA NIM, and MiniMax is NOT
//     in it (regression guard for the Block-13 paid-plan-leak fix);
//   • includeMinimax appends MiniMax as the import-extract backstop;
//   • per-request failover (5xx / 429 / timeout) walks groq → gemini → nim for
//     both complete() and streamComplete(), healthy-primary, and all-down error.
// Run from apps/web:
//   node --import ./scripts/_register-hook.mjs scripts/test-llm-failover.mjs
import assert from "node:assert/strict";

// Dummy keys — fetch is mocked before any provider runs. All four "configured".
process.env.GROQ_API_KEY = "test-groq-key";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.NVIDIA_NIM_API_KEY = "test-nim-key";
process.env.MINIMAX_API_KEY = "test-minimax-key";
process.env.LLM_TIMEOUT_MS = "500";

const { complete, streamComplete, configuredProviders } = await import("../src/lib/llm/index.ts");

const enc = new TextEncoder();
// OpenAI-shaped SSE (Groq + NVIDIA): choices[].delta.content
const sseBody = (tokens) =>
  new ReadableStream({
    start(c) {
      for (const t of tokens)
        c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`));
      c.enqueue(enc.encode("data: [DONE]\n\n"));
      c.close();
    },
  });
// Gemini-shaped SSE: candidates[].content.parts[].text
const geminiSse = (tokens) =>
  new ReadableStream({
    start(c) {
      for (const t of tokens)
        c.enqueue(enc.encode(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: t }] } }] })}\n\n`));
      c.close();
    },
  });

const okJson = (obj) =>
  new Response(JSON.stringify(obj), { status: 200, headers: { "Content-Type": "application/json" } });

// Per-provider OK responses, in each provider's own response shape.
const GROQ_OK = () => okJson({ choices: [{ message: { content: "groq says hi" } }] });
const GEMINI_OK = () => okJson({ candidates: [{ content: { parts: [{ text: "gemini says hi" }] } }] });
const NIM_OK = () => okJson({ choices: [{ message: { content: "nim says hi" } }] });
const MM_OK = () => okJson({ base_resp: { status_code: 0 }, choices: [{ message: { content: "minimax says hi" } }] });
const fail = (status) => () => new Response("boom", { status });
const hang = () => (init) =>
  new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));

/** Install a fetch mock routing by host; returns the call log (in call order). */
function mockFetch(impls) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    const host = u.includes("api.groq.com")
      ? "groq"
      : u.includes("generativelanguage.googleapis.com")
        ? "gemini"
        : u.includes("integrate.api.nvidia.com")
          ? "nim"
          : u.includes("api.minimax.io")
            ? "minimax"
            : null;
    if (!host || !impls[host]) throw new Error(`unexpected fetch: ${u}`);
    calls.push(host);
    return impls[host](init);
  };
  return calls;
}

async function drain(stream) {
  let out = "";
  for await (const t of stream) out += t;
  return out;
}

const MSGS = [{ role: "user", content: "hello" }];
let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`  ok - ${name}`);
}

// ── 1. Chain order + MiniMax-excluded-from-chat (paid-plan-leak regression guard)
const chatChain = configuredProviders().map((p) => p.id.split("/")[0]);
console.log("chat chain:", chatChain);
assert.deepEqual(chatChain, ["groq", "gemini", "nvidia-nim"], "chat chain must be Groq → Gemini → NVIDIA NIM");
assert.ok(!chatChain.includes("minimax"), "MiniMax must NOT be in the chat chain (paid-plan-leak guard)");

// ── 2. includeMinimax appends MiniMax as the import-extract backstop
const importChain = configuredProviders(true).map((p) => p.id.split("/")[0]);
console.log("import chain (includeMinimax):", importChain);
assert.deepEqual(
  importChain,
  ["groq", "gemini", "nvidia-nim", "minimax"],
  "includeMinimax must append MiniMax (and only as the last backstop)",
);

// ── 3. Failover across the real chain ────────────────────────────────────────
await test("complete: groq 500 → gemini serves", async () => {
  const calls = mockFetch({ groq: fail(500), gemini: GEMINI_OK });
  const r = await complete(MSGS);
  assert.equal(r.text, "gemini says hi");
  assert.ok(r.provider.startsWith("gemini/"), `provider was ${r.provider}`);
  assert.deepEqual(calls, ["groq", "gemini"]);
});

await test("complete: groq 429 → gemini 500 → nim serves", async () => {
  const calls = mockFetch({ groq: fail(429), gemini: fail(500), nim: NIM_OK });
  const r = await complete(MSGS);
  assert.equal(r.text, "nim says hi");
  assert.ok(r.provider.startsWith("nvidia-nim/"), `provider was ${r.provider}`);
  assert.deepEqual(calls, ["groq", "gemini", "nim"]);
});

await test("complete: groq hang → timeout → gemini serves", async () => {
  const calls = mockFetch({ groq: hang(), gemini: GEMINI_OK });
  const t0 = Date.now();
  const r = await complete(MSGS);
  assert.ok(r.provider.startsWith("gemini/"));
  assert.ok(Date.now() - t0 >= 450, "should have waited for the per-attempt timeout");
  assert.deepEqual(calls, ["groq", "gemini"]);
});

await test("complete: healthy Groq is primary", async () => {
  const calls = mockFetch({ groq: GROQ_OK, gemini: GEMINI_OK, nim: NIM_OK });
  const r = await complete(MSGS);
  assert.equal(r.text, "groq says hi");
  assert.ok(r.provider.startsWith("groq/"));
  assert.deepEqual(calls, ["groq"]);
});

await test("stream: groq 503 → gemini streams", async () => {
  const calls = mockFetch({
    groq: fail(503),
    gemini: () => new Response(geminiSse(["gemini ", "stream"]), { status: 200 }),
  });
  const { stream, provider } = await streamComplete(MSGS);
  assert.ok(provider.startsWith("gemini/"));
  assert.equal(await drain(stream), "gemini stream");
  assert.deepEqual(calls, ["groq", "gemini"]);
});

await test("stream: healthy Groq is primary", async () => {
  const calls = mockFetch({
    groq: () => new Response(sseBody(["gro", "q"]), { status: 200 }),
    gemini: GEMINI_OK,
  });
  const { stream, provider } = await streamComplete(MSGS);
  assert.ok(provider.startsWith("groq/"));
  assert.equal(await drain(stream), "groq");
  assert.deepEqual(calls, ["groq"]);
});

await test("all providers down → readable error", async () => {
  mockFetch({ groq: fail(500), gemini: fail(502), nim: fail(503) });
  await assert.rejects(() => complete(MSGS), /All LLM providers failed/);
});

// ── 4. MiniMax is reachable ONLY via includeMinimax (import-extract backstop)
await test("includeMinimax: groq+gemini+nim down → MiniMax backstop serves", async () => {
  const calls = mockFetch({ groq: fail(500), gemini: fail(500), nim: fail(500), minimax: MM_OK });
  const r = await complete(MSGS, { includeMinimax: true });
  assert.equal(r.text, "minimax says hi");
  assert.ok(r.provider.startsWith("minimax/"), `provider was ${r.provider}`);
  assert.deepEqual(calls, ["groq", "gemini", "nim", "minimax"]);
});

console.log(`\nPASS — ${passed}/8 failover tests green`);

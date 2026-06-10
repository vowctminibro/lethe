// STEP-1 gate: unit test for the LLM provider chain's per-request failover.
// Mocks global fetch — NO network, NO real keys. Verifies that a MiniMax
// failure (5xx, 429, HTTP-200 base_resp error, or timeout) fails over to
// NVIDIA NIM for BOTH complete() and streamComplete(), and that a healthy
// MiniMax is the primary. Run from apps/web:
//   node --import ./scripts/_register-hook.mjs scripts/test-llm-failover.mjs
import assert from "node:assert/strict";

// Keys are dummies — fetch is mocked before any provider runs.
process.env.MINIMAX_API_KEY = "test-minimax-key";
process.env.NVIDIA_NIM_API_KEY = "test-nim-key";
delete process.env.GROQ_API_KEY;
delete process.env.GEMINI_API_KEY;
process.env.LLM_TIMEOUT_MS = "500";

const { complete, streamComplete, configuredProviders } = await import("../src/lib/llm/index.ts");

const enc = new TextEncoder();
const sseBody = (tokens) =>
  new ReadableStream({
    start(c) {
      for (const t of tokens)
        c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`));
      c.enqueue(enc.encode("data: [DONE]\n\n"));
      c.close();
    },
  });

const okJson = (obj) =>
  new Response(JSON.stringify(obj), { status: 200, headers: { "Content-Type": "application/json" } });

const NIM_OK = () =>
  okJson({ choices: [{ message: { content: "nim says hi" } }] });
const MM_OK = () =>
  okJson({ base_resp: { status_code: 0 }, choices: [{ message: { content: "minimax says hi" } }] });

/** Install a fetch mock routing by host; returns the call log. */
function mockFetch(minimaxImpl, nimImpl) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes("api.minimax.io")) {
      calls.push("minimax");
      return minimaxImpl(init);
    }
    if (u.includes("integrate.api.nvidia.com")) {
      calls.push("nim");
      return nimImpl(init);
    }
    throw new Error(`unexpected fetch: ${u}`);
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

console.log("chain order:", configuredProviders().map((p) => p.id));
assert.deepEqual(
  configuredProviders().map((p) => p.id.split("/")[0]),
  ["minimax", "nvidia-nim"],
  "MiniMax must be primary, NIM fallback",
);

await test("complete: MiniMax 500 → NIM serves", async () => {
  const calls = mockFetch(() => new Response("boom", { status: 500 }), NIM_OK);
  const r = await complete(MSGS);
  assert.equal(r.text, "nim says hi");
  assert.ok(r.provider.startsWith("nvidia-nim/"), `provider was ${r.provider}`);
  assert.deepEqual(calls, ["minimax", "nim"]);
});

await test("complete: MiniMax 429 → NIM serves", async () => {
  mockFetch(() => new Response("rate limited", { status: 429 }), NIM_OK);
  const r = await complete(MSGS);
  assert.ok(r.provider.startsWith("nvidia-nim/"));
});

await test("complete: MiniMax HTTP-200 base_resp error → NIM serves", async () => {
  mockFetch(
    () => okJson({ base_resp: { status_code: 1002, status_msg: "rate limit" }, choices: [] }),
    NIM_OK,
  );
  const r = await complete(MSGS);
  assert.ok(r.provider.startsWith("nvidia-nim/"));
});

await test("complete: MiniMax hang → timeout → NIM serves", async () => {
  mockFetch(
    (init) =>
      new Promise((_, reject) => {
        init.signal.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      }),
    NIM_OK,
  );
  const t0 = Date.now();
  const r = await complete(MSGS);
  assert.ok(r.provider.startsWith("nvidia-nim/"));
  assert.ok(Date.now() - t0 >= 450, "should have waited for the timeout");
});

await test("stream: MiniMax 503 → NIM streams", async () => {
  const calls = mockFetch(
    () => new Response("down", { status: 503 }),
    () => new Response(sseBody(["nim ", "stream"]), { status: 200 }),
  );
  const { stream, provider } = await streamComplete(MSGS);
  assert.ok(provider.startsWith("nvidia-nim/"));
  assert.equal(await drain(stream), "nim stream");
  assert.deepEqual(calls, ["minimax", "nim"]);
});

await test("healthy MiniMax is primary for complete()", async () => {
  const calls = mockFetch(MM_OK, NIM_OK);
  const r = await complete(MSGS);
  assert.equal(r.text, "minimax says hi");
  assert.ok(r.provider.startsWith("minimax/"));
  assert.deepEqual(calls, ["minimax"]);
});

await test("healthy MiniMax is primary for streamComplete()", async () => {
  const calls = mockFetch(
    () => new Response(sseBody(["mini ", "max"]), { status: 200 }),
    NIM_OK,
  );
  const { stream, provider } = await streamComplete(MSGS);
  assert.ok(provider.startsWith("minimax/"));
  assert.equal(await drain(stream), "mini max");
  assert.deepEqual(calls, ["minimax"]);
});

await test("both providers down → readable error", async () => {
  mockFetch(
    () => new Response("down", { status: 500 }),
    () => new Response("down too", { status: 502 }),
  );
  await assert.rejects(() => complete(MSGS), /All LLM providers failed/);
});

console.log(`\nPASS — ${passed}/8 failover tests green`);

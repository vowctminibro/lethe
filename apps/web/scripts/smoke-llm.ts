import { complete, configuredProviders } from "../src/lib/llm/index";

async function main() {
  const cfg = configuredProviders().map((p) => p.id);
  console.log("Configured providers (priority order):", cfg);
  if (cfg.length === 0) {
    console.log("NO providers configured — would throw setup hint.");
    return;
  }
  const t0 = Date.now();
  const res = await complete([{ role: "user", content: "ทดสอบ: ตอบสั้นๆ ว่าคุณคือใคร" }], {
    maxTokens: 120,
    temperature: 0.3,
  });
  console.log("\n=== LLM RESPONDED ===");
  console.log("provider:", res.provider);
  console.log("latency_ms:", Date.now() - t0);
  console.log("text:\n" + res.text);
}

main().catch((e) => {
  console.error("SMOKE FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});

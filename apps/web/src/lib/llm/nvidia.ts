/**
 * NvidiaNimProvider — free, OpenAI-compatible LLM via NVIDIA NIM.
 *
 * Reads NVIDIA_NIM_API_KEY from env (server-only). NIM hosts open-weight models
 * (default: Kimi K2) on a free developer tier, OpenAI-compatible like Groq, so
 * it's the third clone-and-run option in the chain. No key committed.
 *
 * Model overridable via NVIDIA_NIM_MODEL.
 */

import type { ChatMessage, CompleteOptions, LLMProvider } from "./types";

const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "moonshotai/kimi-k2-instruct";

export class NvidiaNimProvider implements LLMProvider {
  get id() {
    return `nvidia-nim/${process.env.NVIDIA_NIM_MODEL || DEFAULT_MODEL}`;
  }

  isConfigured(): boolean {
    return Boolean(process.env.NVIDIA_NIM_API_KEY);
  }

  async complete(messages: ChatMessage[], opts: CompleteOptions = {}): Promise<string> {
    const key = process.env.NVIDIA_NIM_API_KEY;
    if (!key) throw new Error("Missing NVIDIA_NIM_API_KEY");
    const model = process.env.NVIDIA_NIM_MODEL || DEFAULT_MODEL;

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: opts.temperature ?? 0.6,
      max_tokens: opts.maxTokens ?? 700,
    };
    if (opts.json) body.response_format = { type: "json_object" };

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`NVIDIA NIM HTTP ${res.status} ${res.statusText} ${detail.slice(0, 200)}`);
    }
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string") throw new Error("NVIDIA NIM returned no content");
    return text.trim();
  }
}

/**
 * GroqProvider — default LLM. OpenAI-compatible chat completions, free tier.
 *
 * Reads GROQ_API_KEY from env (server-only). Groq hosts open-weight models, so
 * a judge cloning the repo can get a free key at console.groq.com and chat works
 * with zero paid dependency. No key committed — isConfigured() is false until set.
 */

import type { ChatMessage, CompleteOptions, LLMProvider } from "./types";

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export class GroqProvider implements LLMProvider {
  readonly id = `groq/${MODEL}`;

  isConfigured(): boolean {
    return Boolean(process.env.GROQ_API_KEY);
  }

  async complete(messages: ChatMessage[], opts: CompleteOptions = {}): Promise<string> {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("Missing GROQ_API_KEY");

    const body: Record<string, unknown> = {
      model: MODEL,
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
      throw new Error(`Groq HTTP ${res.status} ${res.statusText} ${detail.slice(0, 200)}`);
    }
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string") throw new Error("Groq returned no content");
    return text.trim();
  }
}

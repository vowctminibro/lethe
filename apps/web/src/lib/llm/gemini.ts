/**
 * GeminiProvider — fallback LLM (Google AI Studio, free tier).
 *
 * Reads GEMINI_API_KEY from env (server-only). Used when Groq is unconfigured or
 * erroring, so a judge with either free key gets a working chat. No key committed.
 *
 * Note: Gemini's generateContent uses a different shape than OpenAI — system text
 * goes in `system_instruction`, the chat turns map to `contents` with role
 * "user"/"model".
 */

import type { ChatMessage, CompleteOptions, LLMProvider } from "./types";
import { parseSse } from "./sse";

const MODEL = "gemini-2.0-flash";
const endpoint = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
const streamEndpoint = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;

export class GeminiProvider implements LLMProvider {
  readonly id = `gemini/${MODEL}`;

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async complete(messages: ChatMessage[], opts: CompleteOptions = {}): Promise<string> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY");

    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: opts.temperature ?? 0.6,
        maxOutputTokens: opts.maxTokens ?? 700,
        ...(opts.json ? { responseMimeType: "application/json" } : {}),
      },
    };
    if (system) body.system_instruction = { parts: [{ text: system }] };

    const res = await fetch(endpoint(MODEL, key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Gemini HTTP ${res.status} ${res.statusText} ${detail.slice(0, 200)}`);
    }
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p?.text ?? "")
      .join("");
    if (typeof text !== "string" || !text.trim()) throw new Error("Gemini returned no content");
    return text.trim();
  }

  async stream(messages: ChatMessage[], opts: CompleteOptions = {}): Promise<AsyncIterable<string>> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY");

    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: opts.temperature ?? 0.6,
        maxOutputTokens: opts.maxTokens ?? 700,
      },
    };
    if (system) body.system_instruction = { parts: [{ text: system }] };

    const res = await fetch(streamEndpoint(MODEL, key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Gemini HTTP ${res.status} ${res.statusText} ${detail.slice(0, 200)}`);
    }
    return parseSse(res.body, (e) => {
      const parts = (e as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
        ?.candidates?.[0]?.content?.parts;
      return parts?.map((p) => p?.text ?? "").join("") ?? "";
    });
  }
}

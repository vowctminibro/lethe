/**
 * MiniMaxProvider — paid, primary LLM via MiniMax chatcompletion_v2.
 *
 * Reads MINIMAX_API_KEY from env (server-only) — the same key the legacy image
 * plane uses. OpenAI-shaped messages/choices, with two API quirks handled here:
 *  - errors can arrive as HTTP 200 + base_resp.status_code != 0 → thrown
 *  - response_format json_object is NOT supported (error 2013) → for opts.json
 *    we rely on the prompt and trim any fence/prose wrapper around the object
 *
 * Model overridable via MINIMAX_MODEL.
 */

import type { ChatMessage, CompleteOptions, LLMProvider } from "./types";
import { parseSse } from "./sse";

const ENDPOINT = "https://api.minimax.io/v1/text/chatcompletion_v2";
const DEFAULT_MODEL = "MiniMax-Text-01";

interface BaseResp {
  status_code?: number;
  status_msg?: string;
}

/** MiniMax can't enforce JSON output — slice the first {...} span out of prose/fences. */
function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : text;
}

export class MiniMaxProvider implements LLMProvider {
  get id() {
    return `minimax/${process.env.MINIMAX_MODEL || DEFAULT_MODEL}`;
  }

  isConfigured(): boolean {
    return Boolean(process.env.MINIMAX_API_KEY);
  }

  private body(messages: ChatMessage[], opts: CompleteOptions, stream: boolean): string {
    return JSON.stringify({
      model: process.env.MINIMAX_MODEL || DEFAULT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.6,
      max_tokens: opts.maxTokens ?? 700,
      ...(stream ? { stream: true } : {}),
    });
  }

  private headers(): Record<string, string> {
    const key = process.env.MINIMAX_API_KEY;
    if (!key) throw new Error("Missing MINIMAX_API_KEY");
    return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  }

  async complete(messages: ChatMessage[], opts: CompleteOptions = {}): Promise<string> {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: this.headers(),
      body: this.body(messages, opts, false),
      signal: opts.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`MiniMax HTTP ${res.status} ${res.statusText} ${detail.slice(0, 200)}`);
    }
    const data = await res.json();
    const base: BaseResp | undefined = data?.base_resp;
    if (base && base.status_code !== 0) {
      throw new Error(`MiniMax error ${base.status_code}: ${base.status_msg}`);
    }
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) throw new Error("MiniMax returned no content");
    return opts.json ? extractJsonObject(text.trim()) : text.trim();
  }

  async stream(messages: ChatMessage[], opts: CompleteOptions = {}): Promise<AsyncIterable<string>> {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: this.headers(),
      body: this.body(messages, opts, true),
      signal: opts.signal,
    });
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      throw new Error(`MiniMax HTTP ${res.status} ${res.statusText} ${detail.slice(0, 200)}`);
    }
    // Deltas only — the final frame repeats the full message under choices[0].message,
    // which this pick ignores so nothing is double-yielded.
    return parseSse(
      res.body,
      (e) =>
        (e as { choices?: { delta?: { content?: string } }[] })?.choices?.[0]?.delta?.content ?? "",
    );
  }
}

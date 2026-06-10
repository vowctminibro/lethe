/**
 * LLM factory — provider chain with per-request failover.
 *
 * Order: MiniMax (paid, primary) → NVIDIA NIM → Groq → Gemini. `complete()` and
 * `streamComplete()` try each configured provider in turn; a timeout, 5xx, 429,
 * or any other setup error falls through to the next provider and is logged
 * with `[llm]` so failovers are visible in server logs. If NO provider is
 * configured it throws a readable message telling the cloner exactly which key
 * to set — never a silent or cryptic failure.
 *
 * Per-attempt timeout (default 30s, override LLM_TIMEOUT_MS) covers the whole
 * completion for complete() and the setup-to-first-byte window for streams —
 * once tokens are flowing the stream is never killed by the chain.
 *
 * SERVER-ONLY: providers read secret keys from process.env. Import this only from
 * API routes (app/api/**), never from a client component.
 */

import type { ChatMessage, CompleteOptions, LLMProvider } from "./types";
import { MiniMaxProvider } from "./minimax";
import { GroqProvider } from "./groq";
import { GeminiProvider } from "./gemini";
import { NvidiaNimProvider } from "./nvidia";

export type { ChatMessage, CompleteOptions, LLMProvider } from "./types";

/** Provider chain, highest-priority first. Paid primary, then free fallbacks. */
function providers(): LLMProvider[] {
  return [new MiniMaxProvider(), new NvidiaNimProvider(), new GroqProvider(), new GeminiProvider()];
}

const SETUP_HINT =
  "No LLM provider configured. Set a key in apps/web/.env.local — " +
  "MINIMAX_API_KEY (primary), or a FREE fallback: NVIDIA_NIM_API_KEY " +
  "(build.nvidia.com), GROQ_API_KEY (console.groq.com), or GEMINI_API_KEY " +
  "(aistudio.google.com). See .env.example.";

const DEFAULT_TIMEOUT_MS = 30_000;

function attemptTimeoutMs(): number {
  const n = Number(process.env.LLM_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

/** The configured providers, in priority order. Empty if the cloner set no key. */
export function configuredProviders(): LLMProvider[] {
  return providers().filter((p) => p.isConfigured());
}

/**
 * Run one provider attempt under the per-attempt timeout, chained to the
 * caller's signal. The timer is cleared as soon as the attempt resolves, so a
 * resolved stream keeps its connection alive indefinitely.
 */
async function withFailoverTimeout<T>(
  opts: CompleteOptions | undefined,
  run: (effective: CompleteOptions) => Promise<T>,
): Promise<T> {
  const ms = attemptTimeoutMs();
  const ctrl = new AbortController();
  if (opts?.signal) {
    if (opts.signal.aborted) ctrl.abort(opts.signal.reason);
    else opts.signal.addEventListener("abort", () => ctrl.abort(opts.signal!.reason), { once: true });
  }
  const timer = setTimeout(() => ctrl.abort(new Error(`provider timeout after ${ms}ms`)), ms);
  try {
    return await run({ ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function describe(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

/** Result of a completion: the text plus which model actually produced it. */
export interface CompletionResult {
  text: string;
  /** e.g. "minimax/MiniMax-Text-01" — reported so the UI can show it. */
  provider: string;
}

/**
 * Run a completion through the chain, falling through to the next provider on
 * timeout/5xx/429/any runtime error (logged). Throws a setup hint if no
 * provider is configured, or the last error (annotated) if all fail.
 */
export async function complete(
  messages: ChatMessage[],
  opts?: CompleteOptions,
): Promise<CompletionResult> {
  const chain = configuredProviders();
  if (chain.length === 0) throw new Error(SETUP_HINT);

  let lastErr: unknown;
  for (const p of chain) {
    try {
      const text = await withFailoverTimeout(opts, (o) => p.complete(messages, o));
      return { text, provider: p.id };
    } catch (e) {
      lastErr = e;
      console.warn(`[llm] complete: ${p.id} failed (${describe(e)}) — failing over`);
    }
  }
  throw new Error(`All LLM providers failed. Last error: ${describe(lastErr)}`);
}

/** A live token stream plus which model is producing it. */
export interface StreamResult {
  stream: AsyncIterable<string>;
  provider: string;
}

/**
 * Stream a completion through the chain. Stream-capable providers are tried
 * first; setup errors (bad key, timeout, 5xx, 429) throw before the first
 * token so we fall through cleanly (logged). If no provider can stream, the
 * best provider's complete() result is wrapped as a single-chunk stream —
 * callers never branch.
 */
export async function streamComplete(
  messages: ChatMessage[],
  opts?: CompleteOptions,
): Promise<StreamResult> {
  const chain = configuredProviders();
  if (chain.length === 0) throw new Error(SETUP_HINT);

  let lastErr: unknown;
  for (const p of chain) {
    if (!p.stream) continue;
    try {
      const stream = await withFailoverTimeout(opts, (o) => p.stream!(messages, o));
      return { stream, provider: p.id };
    } catch (e) {
      lastErr = e;
      console.warn(`[llm] stream: ${p.id} failed (${describe(e)}) — failing over`);
    }
  }
  // No streaming provider worked — degrade to a one-chunk "stream".
  try {
    const { text, provider } = await complete(messages, opts);
    return {
      stream: (async function* () {
        yield text;
      })(),
      provider,
    };
  } catch (e) {
    throw new Error(`All LLM providers failed. Last error: ${describe(lastErr ?? e)}`);
  }
}

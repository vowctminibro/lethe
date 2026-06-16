/**
 * LLM factory — provider chain with per-request failover.
 *
 * Chat order: Groq → Gemini → NVIDIA NIM. All three are free-tier; MiniMax
 * (paid) is deliberately EXCLUDED from the chat chain so it can never answer a
 * chat message and burn the paid plan. It is opted into ONLY by server-side
 * import-extract (CompleteOptions.includeMinimax) as a last-resort backstop.
 * `complete()` and `streamComplete()` try each configured provider in turn; a
 * timeout, 5xx, 429, or any other setup error falls through to the next
 * provider and is logged with `[llm]` so failovers are visible in server logs.
 * If NO provider is configured it throws a readable message telling the cloner
 * exactly which key to set — never a silent or cryptic failure.
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

/**
 * The DEFAULT chat chain, highest-priority first — all free-tier. MiniMax is
 * NOT here: it must never answer chat. `includeMinimax` appends it last, for
 * server-side import-extract only.
 */
function providers(includeMinimax = false): LLMProvider[] {
  const chat: LLMProvider[] = [new GroqProvider(), new GeminiProvider(), new NvidiaNimProvider()];
  return includeMinimax ? [...chat, new MiniMaxProvider()] : chat;
}

const SETUP_HINT =
  "No LLM provider configured. Set a FREE key in apps/web/.env.local — " +
  "GROQ_API_KEY (console.groq.com), GEMINI_API_KEY (aistudio.google.com), or " +
  "NVIDIA_NIM_API_KEY (build.nvidia.com). See .env.example.";

const DEFAULT_TIMEOUT_MS = 30_000;

function attemptTimeoutMs(): number {
  const n = Number(process.env.LLM_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

/** The configured providers, in priority order. Empty if the cloner set no key. */
export function configuredProviders(includeMinimax = false): LLMProvider[] {
  return providers(includeMinimax).filter((p) => p.isConfigured());
}

export interface AvailableModel {
  /** Stable selector key: the provider id's first segment, e.g. "groq". */
  key: string;
  /** Full provider id, e.g. "groq/llama-3.3-70b-versatile". */
  id: string;
  /** Honest display label — model first, host second. */
  label: string;
  /** Whether the provider has its key and can answer as itself right now. */
  configured: boolean;
  /** Whether this entry is the default selection. */
  isDefault: boolean;
}

/**
 * The PUBLIC selector catalog — free-tier models the dropdown offers. This is a
 * SUBSET of the failover chain (see providers()): a provider can stay in the
 * chain as a fallback without being user-selectable.
 *
 * Gemini is intentionally NOT listed: its prod key is currently failing
 * (invalid/quota), so offering it would surface a model that never answers as
 * itself — better to show only Groq + NVIDIA NIM, which work 100%. Gemini STAYS
 * in the failover chain (providers()) so it resumes automatically if the key is
 * restored; only the selector hides it. MiniMax is paid and stays server-side.
 * NIM's Kimi K2 reached EOL (410 — probed 2026-06-13), so the NIM slot is
 * labeled by what it actually serves. Default = first CONFIGURED entry unless
 * NEXT_PUBLIC_DEFAULT_MODEL overrides (→ Groq).
 */
const FREE_CATALOG: { key: string; id: string; label: string }[] = [
  { key: "groq", id: "groq/llama-3.3-70b-versatile", label: "Llama 3.3 70B · Groq" },
  { key: "nvidia-nim", id: "nvidia-nim/meta/llama-3.3-70b-instruct", label: "Llama 3.3 70B · NVIDIA NIM" },
];

/** The public model list, default first-configured (env-overridable). */
export function availableModels(): AvailableModel[] {
  const configuredKeys = new Set(configuredProviders().map((p) => p.id.split("/")[0]));
  const envDefault = process.env.NEXT_PUBLIC_DEFAULT_MODEL;
  const defaultKey =
    (envDefault && FREE_CATALOG.some((m) => m.key === envDefault) && envDefault) ||
    FREE_CATALOG.find((m) => configuredKeys.has(m.key))?.key ||
    FREE_CATALOG[0].key;
  return FREE_CATALOG.map((m) => ({
    ...m,
    configured: configuredKeys.has(m.key),
    isDefault: m.key === defaultKey,
  }));
}

/**
 * The chain with the user's preferred provider moved to the front. Unknown or
 * unconfigured keys leave the default order — selection can never brick chat.
 */
function chainPreferring(prefer?: string, includeMinimax = false): LLMProvider[] {
  const chain = configuredProviders(includeMinimax);
  if (!prefer) return chain;
  const i = chain.findIndex((p) => p.id.split("/")[0] === prefer);
  if (i <= 0) return chain;
  return [chain[i], ...chain.slice(0, i), ...chain.slice(i + 1)];
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
  /** e.g. "groq/llama-3.3-70b-versatile" — reported so the UI can show it. */
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
  const chain = chainPreferring(opts?.prefer, opts?.includeMinimax);
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
  const chain = chainPreferring(opts?.prefer, opts?.includeMinimax);
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

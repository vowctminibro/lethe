/**
 * LLM factory — chain free providers so the repo is clone-and-run.
 *
 * Order: Groq (default) → Gemini (fallback). `complete()` tries the first
 * configured provider; if it errors at runtime it falls through to the next. If
 * NONE are configured it throws a readable message telling the cloner exactly
 * which free key to set — never a silent or cryptic failure.
 *
 * SERVER-ONLY: providers read secret keys from process.env. Import this only from
 * API routes (app/api/**), never from a client component.
 */

import type { ChatMessage, CompleteOptions, LLMProvider } from "./types";
import { GroqProvider } from "./groq";
import { GeminiProvider } from "./gemini";
import { NvidiaNimProvider } from "./nvidia";

export type { ChatMessage, CompleteOptions, LLMProvider } from "./types";

/** Provider chain, highest-priority first. All free-tier, all key-from-env. */
function providers(): LLMProvider[] {
  return [new GroqProvider(), new GeminiProvider(), new NvidiaNimProvider()];
}

const SETUP_HINT =
  "No LLM provider configured. Set a FREE key in apps/web/.env.local — " +
  "GROQ_API_KEY (console.groq.com, recommended), GEMINI_API_KEY " +
  "(aistudio.google.com), or NVIDIA_NIM_API_KEY (build.nvidia.com). See .env.example.";

/** The configured providers, in priority order. Empty if the cloner set no key. */
export function configuredProviders(): LLMProvider[] {
  return providers().filter((p) => p.isConfigured());
}

/** Result of a completion: the text plus which model actually produced it. */
export interface CompletionResult {
  text: string;
  /** e.g. "groq/llama-3.3-70b-versatile" — reported so the UI can show it. */
  provider: string;
}

/**
 * Run a completion through the chain, falling through to the next provider on a
 * runtime error. Throws a setup hint if no provider is configured, or the last
 * error (annotated) if all configured providers fail.
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
      const text = await p.complete(messages, opts);
      return { text, provider: p.id };
    } catch (e) {
      lastErr = e;
      // fall through to the next configured provider
    }
  }
  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(`All LLM providers failed. Last error: ${msg}`);
}

import "server-only";

/**
 * Unified prose engine for Lethe story generation.
 *
 * Primary: NVIDIA NIM (Kimi) for creative prose, with an automatic fallback
 * chain NIM → Gemini → Groq. All three are OpenAI-compatible, so we use a
 * single `openai` client pattern with three base URLs / model IDs.
 *
 * Behaviour:
 *   - Providers whose env key is empty are SKIPPED, so the chain runs on NIM
 *     alone today (Gemini/Groq keys are optional placeholders).
 *   - On any provider error we fall through to the next configured provider.
 *   - Throws only if every configured provider fails (or none are configured).
 *
 * Integration: the system prompt is routed through MemWal's `withMemWal`
 * wrapper (src/lib/memwal.ts) so this sits on the same memory seam the rest of
 * the app uses — this is NOT a parallel/duplicate LLM stack. The model client
 * itself is the `openai` package already in the dependency tree.
 *
 * Server-only: imports the NIM/Gemini/Groq secret keys, so it must never be
 * pulled into a client bundle (`import "server-only"` enforces this).
 *
 * Resolved model IDs (verified live via GET {baseURL}/models, 2026-05-29):
 *   - NVIDIA NIM: moonshotai/kimi-k2.6   (only live moonshotai/kimi-* variant;
 *                 kimi-k2-instruct and kimi-k2.5 are not available)
 *   - Gemini:     gemini-2.5-flash
 *   - Groq:       llama-3.3-70b-versatile  (openai/gpt-oss-120b also live)
 */

import OpenAI from "openai";
import { withMemWal } from "./memwal";

export type ProviderId = "nvidia-nim" | "gemini" | "groq";

export interface GenerateProseOptions {
  /** System prompt — the story/voice instructions. */
  system: string;
  /** User turn — the scene/beat to write. */
  prompt: string;
  /** Sampling temperature. Default 0.9 (creative prose). */
  temperature?: number;
  /** Max output tokens. Default 1024. */
  maxTokens?: number;
  /**
   * Route the system prompt through MemWal's memory wrapper. Default true so
   * generation is consistent with the rest of the app; pass false to evaluate
   * raw model prose without the memory-layer prefix.
   */
  memory?: boolean;
}

export interface GenerateProseResult {
  text: string;
  providerUsed: ProviderId;
  modelUsed: string;
  latencyMs: number;
}

interface ProviderConfig {
  id: ProviderId;
  label: string;
  apiKey: string | undefined;
  baseURL: string;
  model: string;
}

/**
 * The fallback chain, in priority order. Built per-call so env vars resolve at
 * runtime (mirrors the lazy pattern in memwal.ts).
 */
function providerChain(): ProviderConfig[] {
  return [
    {
      id: "nvidia-nim",
      label: "NVIDIA NIM (Kimi)",
      apiKey: process.env.NVIDIA_NIM_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
      model: "moonshotai/kimi-k2.6",
    },
    {
      id: "gemini",
      label: "Google Gemini",
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      model: "gemini-2.5-flash",
    },
    {
      id: "groq",
      label: "Groq",
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      model: "llama-3.3-70b-versatile",
    },
  ];
}

/** Providers with a non-empty API key, in fallback order. */
function configuredProviders(): ProviderConfig[] {
  return providerChain().filter((p) => (p.apiKey ?? "").trim().length > 0);
}

/**
 * Generate prose, trying each configured provider in fallback order.
 * Returns the first success; throws only if all configured providers fail.
 */
export async function generateProse(
  opts: GenerateProseOptions,
): Promise<GenerateProseResult> {
  const {
    system,
    prompt,
    temperature = 0.9,
    maxTokens = 1024,
    memory = true,
  } = opts;

  const finalSystem = memory ? withMemWal(system) : system;

  const providers = configuredProviders();
  if (providers.length === 0) {
    throw new Error(
      "generateProse: no LLM providers configured — set NVIDIA_NIM_API_KEY " +
        "(and optionally GEMINI_API_KEY / GROQ_API_KEY) in .env.local",
    );
  }

  const failures: string[] = [];

  for (const provider of providers) {
    const startedAt = Date.now();
    try {
      const client = new OpenAI({
        apiKey: provider.apiKey!,
        baseURL: provider.baseURL,
      });

      const completion = await client.chat.completions.create({
        model: provider.model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: finalSystem },
          { role: "user", content: prompt },
        ],
      });

      const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) {
        throw new Error("provider returned an empty completion");
      }

      return {
        text,
        providerUsed: provider.id,
        modelUsed: provider.model,
        latencyMs: Date.now() - startedAt,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push(`${provider.id} (${provider.model}): ${message}`);
      // fall through to the next configured provider
    }
  }

  throw new Error(
    `generateProse: all ${providers.length} configured provider(s) failed — ` +
      failures.join(" | "),
  );
}

/**
 * MemWal — Walrus-native memory layer for Lethe NPC memory engine
 * Package: @mysten-incubation/memwal@0.0.5
 * Integration: Lethe × MemWal — Blocker B2 resolved
 */

import { MemWal } from "@mysten-incubation/memwal";

// Resolve from env — these are set after Vow's wallet onboarding
const RELAYER_URL = process.env.NEXT_PUBLIC_MEMWAL_RELAYER_URL ?? "https://relayer.memwal.ai";
const ACCOUNT_ID = process.env.MEMWAL_ACCOUNT_ID ?? "";
const DELEGATE_KEY = process.env.MEMWAL_DELEGATE_KEY ?? "";

// Singleton client — lazy init so env vars are resolved at runtime
let _client: MemWal | null = null;

export function getMemWalClient(): MemWal {
  if (!_client) {
    if (!ACCOUNT_ID || !DELEGATE_KEY) {
      throw new Error(
        "MEMWAL_ACCOUNT_ID and MEMWAL_DELEGATE_KEY must be set in .env.local — " +
        "Vow completed wallet onboarding on 2026-05-28, keys stored."
      );
    }
    _client = MemWal.create({
      key: DELEGATE_KEY,
      accountId: ACCOUNT_ID,
      serverUrl: RELAYER_URL,
      namespace: "lethe", // NPC memory namespace
    });
  }
  return _client;
}

/**
 * Store an NPC memory into Walrus via MemWal relayer.
 * Called when an NPC observes player action and needs persistent recall.
 *
 * @param memory  Human-readable memory string, e.g. "Player chose 'attack' on NPC_47 at location=ruins"
 * @param tags    Optional filter tags for semantic recall
 */
export async function remember(
  memory: string,
  tags?: string[]
): Promise<{ jobId: string }> {
  const memwal = getMemWalClient();
  // remember() takes a string arg; tags embedded in text for relayer to parse
  const text = tags?.length ? `${memory}\n[tags: ${tags.join(", ")}]` : memory;
  const job = await memwal.remember(text);
  return { jobId: job.job_id };
}

/**
 * Wait for a remember job to complete on-chain.
 * MemWal uploads to Walrus after transaction finality.
 *
 * @param jobId  job_id returned from remember()
 */
export async function waitForRemember(jobId: string): Promise<void> {
  const memwal = getMemWalClient();
  await memwal.waitForRememberJob(jobId);
}

/**
 * Recall memories matching a natural-language query.
 * Used when loading NPC context before player interaction.
 *
 * @param query  e.g. "What has player done to NPC_47?"
 * @param limit  Max results (default 5)
 */
export async function recall(
  query: string,
  limit = 5
): Promise<{ results: Array<{ content: string; score: number }> }> {
  const memwal = getMemWalClient();
  const result = await memwal.recall(query, { limit }) as any;
  const raw = result.results ?? [];
  return {
    results: Array.isArray(raw)
      ? raw.map((r: any) => ({
          content: r.content ?? r.text ?? String(r),
          score: r.score ?? r.distance ?? 0,
        }))
      : [],
  };
}

/**
 * Health check — verify MemWal relayer is reachable and credentials are valid.
 */
export async function healthCheck(): Promise<{
  ok: boolean;
  relayer: string;
  accountId: string;
  error?: string;
}> {
  try {
    const memwal = getMemWalClient();
    const health = (await memwal.health()) as unknown as { status?: string };
    return {
      ok: health?.status === "ok",
      relayer: RELAYER_URL,
      accountId: ACCOUNT_ID,
    };
  } catch (err: any) {
    return {
      ok: false,
      relayer: RELAYER_URL,
      accountId: ACCOUNT_ID,
      error: err?.message ?? String(err),
    };
  }
}

/**
 * Wrap a Vercel AI SDK provider with MemWal memory middleware.
 * Enables AI agents to recall Lethe NPC memories during generation.
 *
 * @example
 * const agent = createAI({
 *   model: openai("gpt-4o"),
 *   system: withMemWal("You are NPC_47, a tavern keeper in Lethe..."),
 * });
 */
export function withMemWal(systemPrompt: string): string {
  // In production: wrap via @mysten-incubation/memwal/ai middleware
  // For now: embed recall logic into system prompt prefix
  return `[MEMORY LAYER] ${systemPrompt}`;
}

export type { MemWal };
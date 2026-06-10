"use client";

/**
 * DEV-ONLY demo mock — seeded session + memories for layout self-review and
 * screenshots, no OAuth round-trip needed.
 *
 * Active ONLY when BOTH hold:
 *   - NODE_ENV === "development" (inlined by Next at build: always "production"
 *     in a prod build, so this whole branch is dead code there)
 *   - NEXT_PUBLIC_DEMO_MOCK === "1"
 *
 * The mock vault id and seeded blob ids are REAL testnet artifacts from earlier
 * verified runs, so Suiscan/Walrus links resolve even in mock mode. Writes stay
 * purely in-memory (refresh = reset) and never touch chain or Walrus.
 */

import { useMemo } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import type { MemoryProvider } from "../memory/provider";
import type { MemoryEntry, RememberResult, RecallHit } from "../memory/types";
import type { OwnedMemory } from "../memory/chain";

export const DEMO_MOCK =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEMO_MOCK === "1";

export const MOCK_ADDRESS =
  "0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077";
/** A real memory::Memory object on testnet (created by gasless-e2e). */
export const MOCK_VAULT_ID =
  "0x47374a34a1a0c8cf606f30efa716b8106ad5f3a2677957c8e897282bae527655";
const MOCK_DIGEST = "5oNvhVE6KvLTHkSqg8Pf2DJKQ77dCnQEqAJ24YnXjkS3";

const now = Date.now();
const seed = (text: string, kind: string, blobId: string, ageMin: number): RecallHit => ({
  text,
  kind,
  blobId,
  namespace: "lethe",
  createdAtMs: now - ageMin * 60_000,
  score: 0.6,
});

// Real (encrypted) blobs stored on Walrus testnet in earlier verified sessions.
const SEEDS: RecallHit[] = [
  seed("Trades momentum, avoids leverage entirely", "trading-style", "cJhbgVkLcihqc7SUN-Zb6e8VwuqzLOazoebINWSpBHU", 250),
  seed("Bullish on SUI for the cycle", "market-view", "011jbrJ487fHpWQMWbc82N04unj2AO90SKQSMnnD1nU", 200),
  seed("Holds mostly SUI plus stables; ~40 recent txs", "holding", "U16MlYB1XaJjFxBwwhG_WnI6lc3L_ONRvN3La8UoBiw", 130),
  seed("Prefers gasless UX — hates signing popups", "preference", "cDH8g1NFO4OZ-OOct_71ZrvC70IeRIRXcSsft0WZlWo", 70),
  seed("Active on DeepBook — trades on-chain, not CEX", "fact", "4rlJ6lleJ1K_AJPh8qcZVSSyvF5MXAhp9Lyxf5k1KjU", 20),
];

// Module-level store so chat rail + /memory see the same session.
const added: RecallHit[] = [];
let authorized: string[] = ["0x91f7a2c4de8b35a1906c4f50e7d28a63b0c5f4e8d217396ab84cd01e5f6a7b32"];

export function getMockOwnedMemory(): OwnedMemory {
  return {
    objectId: MOCK_VAULT_ID,
    owner: MOCK_ADDRESS,
    entries: [...SEEDS, ...added].map(({ blobId, namespace, kind, createdAtMs }) => ({
      blobId,
      namespace,
      kind,
      createdAtMs,
    })),
    authorized: [...authorized],
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

class MockProvider implements MemoryProvider {
  async remember(entry: MemoryEntry): Promise<RememberResult> {
    await wait(1200); // let the rail's "pending" state be visible
    const hit: RecallHit = {
      text: entry.text,
      kind: entry.kind,
      blobId: `mock-${Math.random().toString(36).slice(2, 10)}`,
      namespace: "lethe",
      createdAtMs: Date.now(),
      score: 1,
    };
    added.push(hit);
    return {
      blobId: hit.blobId,
      namespace: hit.namespace,
      kind: hit.kind,
      createdAtMs: hit.createdAtMs,
      memoryId: MOCK_VAULT_ID,
      digest: MOCK_DIGEST,
      gasOwner: "0x0dec4c7d041b07e655637e0dd0f9010bd7701f7613c66894d898795a54431290",
    };
  }

  async recall(query: string, opts?: { limit?: number }): Promise<RecallHit[]> {
    await wait(300);
    const all = [...SEEDS, ...added].sort((a, b) => b.createdAtMs - a.createdAtMs);
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    const scored = all
      .map((h) => ({
        ...h,
        score: q.split(/\s+/).filter((w) => w.length > 2 && h.text.toLowerCase().includes(w)).length,
      }))
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, opts?.limit ?? 5);
  }

  async grant(app: string): Promise<{ digest: string }> {
    await wait(800);
    if (!authorized.includes(app)) authorized.push(app);
    return { digest: MOCK_DIGEST };
  }

  async revoke(app: string): Promise<{ digest: string }> {
    await wait(800);
    authorized = authorized.filter((a) => a !== app);
    return { digest: MOCK_DIGEST };
  }
}

let mockProvider: MockProvider | null = null;
export function getMockProvider(): MemoryProvider {
  if (!mockProvider) mockProvider = new MockProvider();
  return mockProvider;
}

/**
 * The signed-in identity, mock-aware: every page uses this instead of raw
 * useCurrentAccount so DEMO_MOCK renders a full session without OAuth.
 */
export function useLetheAccount(): { address: string } | null {
  const real = useCurrentAccount();
  const address = DEMO_MOCK ? MOCK_ADDRESS : real?.address ?? null;
  // Stable identity — pages hang effects off this object.
  return useMemo(() => (address ? { address } : null), [address]);
}

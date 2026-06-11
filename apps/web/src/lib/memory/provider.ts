/**
 * MemoryProvider — the swappable contract for the memory data plane.
 *
 * Method names mirror the MemWal SDK (`remember` / `recall` / `grant` / `revoke`)
 * on purpose: when MemWal ships 0.0.4 we can drop in `MemWalProvider` behind this
 * same interface without touching the chat surface or the memory view. Today the
 * default implementation is `ManualProvider` (Walrus + server-side per-user
 * encryption + the on-chain `memory::Memory` object).
 */

import type { MemoryEntry, RememberResult, RecallHit } from "./types";

export interface MemoryProvider {
  /** Persist a fact: encrypt → store on Walrus → reference on the owned Memory object. */
  remember(entry: MemoryEntry): Promise<RememberResult>;
  /** Retrieve the facts most relevant to a natural-language query. */
  recall(query: string, opts?: { limit?: number }): Promise<RecallHit[]>;
  /** Grant an app address read access (gasless, owner-only on chain). */
  grant(app: string): Promise<{ digest: string }>;
  /** Revoke an app address's read access = forget (gasless, owner-only). */
  revoke(app: string): Promise<{ digest: string }>;
  /**
   * Remove one entry from the vault (= forget a single memory). Drops the
   * on-chain reference via `memory::remove_entry`; the encrypted Walrus blob
   * becomes orphaned ciphertext. Gasless, owner-only.
   */
  forget(blobId: string): Promise<{ digest: string }>;
}

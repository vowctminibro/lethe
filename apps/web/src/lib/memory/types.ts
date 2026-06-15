/**
 * Shared types for the Lethe memory layer.
 *
 * A "memory" is a small crypto-native fact the user tells the agent ("momentum
 * trader", "bullish SUI"). Each one is encrypted, stored on Walrus, and
 * referenced on-chain by the user's owned `memory::Memory` object.
 */

/** A fact the user wants remembered, before it is stored. */
export interface MemoryEntry {
  /** Free text the user stated. */
  text: string;
  /** Semantic kind, e.g. "trading-style", "holding", "preference". */
  kind: string;
}

/** A pointer to a stored entry — mirrors the on-chain `BlobRef`. */
export interface BlobRef {
  /** Walrus blob id holding the (encrypted) entry. */
  blobId: string;
  /** MemWal namespace / logical store this entry belongs to. */
  namespace: string;
  /** Semantic kind of the entry. */
  kind: string;
  /** Creation time (ms since epoch). */
  createdAtMs: number;
}

/** Result of a successful `remember()` — the on-chain ref plus the tx digest. */
export interface RememberResult extends BlobRef {
  /** The user's Memory object id this entry was appended to. */
  memoryId: string;
  /** Digest of the gasless `add_entry` (or `create` + `add_entry`) tx. */
  digest: string;
  /** Gas sponsor address (proves gasless), if resolvable. */
  gasOwner: string | null;
  /** Stored (encrypted) blob size in bytes — the real Walrus footprint. */
  size?: number;
}

/** A recalled entry, with its decrypted text and a relevance score. */
export interface RecallHit extends BlobRef {
  /** Decrypted entry text. */
  text: string;
  /** Relevance score for the query in [0,1]; higher is better. */
  score: number;
  /** Stored (encrypted) blob size in bytes, when read client-side. */
  size?: number;
}

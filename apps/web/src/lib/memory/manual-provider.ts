/**
 * ManualProvider — the default MemoryProvider.
 *
 * "Manual" = we drive the data plane ourselves (Walrus + client-side encryption +
 * the owned `memory::Memory` object) rather than the MemWal relayer, which is
 * gated on an unpublished SDK (see REAIM.md §3). It formalizes the MemWalManual
 * approach behind the MemoryProvider contract.
 *
 * Write path (remember): ensure the user owns a Memory object (mint gasless if
 * not) → POST /api/memory/remember (encrypt + Walrus store) → append the blob ref
 * on-chain via gasless `add_entry`.
 * Read path (recall): read the Memory object's blob refs on-chain → POST
 * /api/memory/recall (Walrus fetch + decrypt + rank).
 *
 * All chain writes go through the Enoki sponsor flow (src/lib/memory/gasless.ts),
 * so the user never needs gas.
 */

import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import type { MemoryProvider } from "./provider";
import type { MemoryEntry, RememberResult, RecallHit, BlobRef } from "./types";
import { executeGasless, ensureVault, type SignFn } from "./gasless";
import {
  buildAddEntryTx,
  buildGrantTx,
  buildRevokeTx,
  getOwnedMemory,
  MEMORY_PACKAGE_ID,
} from "./chain";

export type { SignFn } from "./gasless";

export interface ManualProviderDeps {
  ownerAddress: string;
  client: SuiJsonRpcClient;
  signTransaction: SignFn;
  /** MemWal namespace / logical store. Defaults to "lethe". */
  namespace?: string;
}

export class ManualProvider implements MemoryProvider {
  #deps: ManualProviderDeps;
  #namespace: string;

  constructor(deps: ManualProviderDeps) {
    if (!MEMORY_PACKAGE_ID) throw new Error("Missing NEXT_PUBLIC_MEMORY_PACKAGE_ID");
    this.#deps = deps;
    this.#namespace = deps.namespace ?? "lethe";
  }

  async #ensureMemoryId(): Promise<string> {
    const { vaultId } = await ensureVault(this.#deps);
    return vaultId;
  }

  // ── MemoryProvider ─────────────────────────────────────────────────────

  async remember(entry: MemoryEntry): Promise<RememberResult> {
    const memoryId = await this.#ensureMemoryId();

    const res = await fetch("/api/memory/remember", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerAddress: this.#deps.ownerAddress,
        text: entry.text,
        kind: entry.kind,
        namespace: this.#namespace,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error ?? "Walrus store failed");
    }
    const ref: BlobRef = await res.json();

    const { digest, gasOwner } = await executeGasless(this.#deps, buildAddEntryTx({ memoryId, ref }));
    return { ...ref, memoryId, digest, gasOwner };
  }

  async recall(query: string, opts?: { limit?: number }): Promise<RecallHit[]> {
    const memory = await getOwnedMemory(this.#deps.client, this.#deps.ownerAddress);
    if (!memory || memory.entries.length === 0) return [];

    const res = await fetch("/api/memory/recall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerAddress: this.#deps.ownerAddress,
        query,
        refs: memory.entries,
        limit: opts?.limit,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error ?? "recall failed");
    }
    const { hits } = await res.json();
    return hits as RecallHit[];
  }

  async grant(app: string): Promise<{ digest: string }> {
    const memoryId = await this.#ensureMemoryId();
    const { digest } = await executeGasless(this.#deps, buildGrantTx({ memoryId, app }));
    return { digest };
  }

  async revoke(app: string): Promise<{ digest: string }> {
    const memoryId = await this.#ensureMemoryId();
    const { digest } = await executeGasless(this.#deps, buildRevokeTx({ memoryId, app }));
    return { digest };
  }
}

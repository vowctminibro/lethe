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
 * All chain writes go through the Enoki sponsor flow, so the user never needs gas.
 */

import { Transaction } from "@mysten/sui/transactions";
import { toBase64, fromBase64 } from "@mysten/sui/utils";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import type { MemoryProvider } from "./provider";
import type { MemoryEntry, RememberResult, RecallHit, BlobRef } from "./types";
import {
  buildCreateMemoryTx,
  buildAddEntryTx,
  buildGrantTx,
  buildRevokeTx,
  getOwnedMemory,
  MEMORY_PACKAGE_ID,
} from "./chain";

/** Minimal shape of dapp-kit's `useSignTransaction().mutateAsync`. */
export type SignFn = (input: { transaction: Transaction }) => Promise<{ signature: string }>;

export interface ManualProviderDeps {
  ownerAddress: string;
  client: SuiJsonRpcClient;
  signTransaction: SignFn;
  /** MemWal namespace / logical store. Defaults to "lethe". */
  namespace?: string;
}

interface GaslessResult {
  digest: string;
  gasOwner: string | null;
  /** Object id created by the tx whose type ends with `typeSuffix`, if requested. */
  createdId: string | null;
}

export class ManualProvider implements MemoryProvider {
  #deps: ManualProviderDeps;
  #namespace: string;

  constructor(deps: ManualProviderDeps) {
    if (!MEMORY_PACKAGE_ID) throw new Error("Missing NEXT_PUBLIC_MEMORY_PACKAGE_ID");
    this.#deps = deps;
    this.#namespace = deps.namespace ?? "lethe";
  }

  // ── gasless tx plumbing (mirrors src/lib/mint.ts) ──────────────────────

  async #executeGasless(tx: Transaction, typeSuffix?: string): Promise<GaslessResult> {
    const { ownerAddress, client, signTransaction } = this.#deps;
    tx.setSender(ownerAddress);
    const kindBytes = await tx.build({ client, onlyTransactionKind: true });

    const createRes = await fetch("/api/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        sender: ownerAddress,
        transactionKindBytes: toBase64(kindBytes),
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err?.error ?? "Sponsorship failed");
    }
    const { bytes, digest } = await createRes.json();

    const { signature } = await signTransaction({ transaction: Transaction.from(fromBase64(bytes)) });

    const execRes = await fetch("/api/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "execute", digest, signature }),
    });
    if (!execRes.ok) {
      const err = await execRes.json().catch(() => ({}));
      throw new Error(err?.error ?? "Execution failed");
    }
    const { digest: finalDigest } = await execRes.json();
    return this.#resolveReceipts(finalDigest, typeSuffix);
  }

  async #resolveReceipts(digest: string, typeSuffix?: string): Promise<GaslessResult> {
    const { client } = this.#deps;
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const tx = await client.getTransactionBlock({
          digest,
          options: { showObjectChanges: true, showInput: true },
        });
        let createdId: string | null = null;
        if (typeSuffix) {
          for (const ch of tx.objectChanges ?? []) {
            if (ch.type === "created" && String(ch.objectType ?? "").endsWith(typeSuffix)) {
              createdId = ch.objectId;
              break;
            }
          }
        }
        const gasOwnerRaw = tx.transaction?.data?.gasData?.owner ?? null;
        const gasOwner = typeof gasOwnerRaw === "string" ? gasOwnerRaw : null;
        if (gasOwner || createdId || !typeSuffix) return { digest, gasOwner, createdId };
      } catch {
        /* fullnode lag — retry */
      }
      await new Promise((r) => setTimeout(r, 800));
    }
    return { digest, gasOwner: null, createdId: null };
  }

  /** Return the user's Memory object id, minting one (gasless) if absent. */
  async #ensureMemoryId(): Promise<string> {
    const existing = await getOwnedMemory(this.#deps.client, this.#deps.ownerAddress);
    if (existing) return existing.objectId;

    const { createdId } = await this.#executeGasless(buildCreateMemoryTx(), "::memory::Memory");
    if (createdId) return createdId;

    // Fallback: the create executed but the receipt lagged — re-read owned objects.
    const after = await getOwnedMemory(this.#deps.client, this.#deps.ownerAddress);
    if (after) return after.objectId;
    throw new Error("Created Memory but could not resolve its object id");
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

    const { digest, gasOwner } = await this.#executeGasless(buildAddEntryTx({ memoryId, ref }));
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
    const { digest } = await this.#executeGasless(buildGrantTx({ memoryId, app }));
    return { digest };
  }

  async revoke(app: string): Promise<{ digest: string }> {
    const memoryId = await this.#ensureMemoryId();
    const { digest } = await this.#executeGasless(buildRevokeTx({ memoryId, app }));
    return { digest };
  }
}

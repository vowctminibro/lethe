/**
 * Gasless tx plumbing + vault lifecycle, shared by ManualProvider and the
 * vault-birth hook.
 *
 * Every chain write goes sponsor-create → user sign → sponsor-execute through
 * /api/sponsor (Enoki), so the user never holds gas. `ensureVault` is the single
 * entry point for "the signed-in user has a Memory vault": it dedupes concurrent
 * calls per address (landing hero + chat page + React strict-mode effects can
 * all race), so at most one `memory::create` is ever in flight per user.
 */

import { Transaction } from "@mysten/sui/transactions";
import { toBase64, fromBase64 } from "@mysten/sui/utils";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { buildCreateMemoryTx, getOwnedMemory } from "./chain";

/** Minimal shape of dapp-kit's `useSignTransaction().mutateAsync`. */
export type SignFn = (input: { transaction: Transaction }) => Promise<{ signature: string }>;

export interface GaslessDeps {
  ownerAddress: string;
  client: SuiJsonRpcClient;
  signTransaction: SignFn;
}

export interface GaslessResult {
  digest: string;
  gasOwner: string | null;
  /** Object id created by the tx whose type ends with `typeSuffix`, if requested. */
  createdId: string | null;
}

export async function executeGasless(
  deps: GaslessDeps,
  tx: Transaction,
  typeSuffix?: string,
): Promise<GaslessResult> {
  const { ownerAddress, client, signTransaction } = deps;
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
  return resolveReceipts(deps.client, finalDigest, typeSuffix);
}

async function resolveReceipts(
  client: SuiJsonRpcClient,
  digest: string,
  typeSuffix?: string,
): Promise<GaslessResult> {
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

export interface EnsuredVault {
  vaultId: string;
  /** True when this call minted the vault (first session) — the "birth" moment. */
  justCreated: boolean;
  /** Create-tx digest when justCreated. */
  digest: string | null;
}

// One create per address, app-wide: hero + chat + strict-mode double effects
// all funnel through the same promise.
const inflight = new Map<string, Promise<EnsuredVault>>();

export function ensureVault(deps: GaslessDeps): Promise<EnsuredVault> {
  const existing = inflight.get(deps.ownerAddress);
  if (existing) return existing;

  const p = (async (): Promise<EnsuredVault> => {
    const owned = await getOwnedMemory(deps.client, deps.ownerAddress);
    if (owned) return { vaultId: owned.objectId, justCreated: false, digest: null };

    const { createdId, digest } = await executeGasless(deps, buildCreateMemoryTx(), "::memory::Memory");
    if (createdId) return { vaultId: createdId, justCreated: true, digest };

    // The create executed but the receipt lagged — re-read owned objects.
    const after = await getOwnedMemory(deps.client, deps.ownerAddress);
    if (after) return { vaultId: after.objectId, justCreated: true, digest };
    throw new Error("Created your vault but couldn't resolve its object id — refresh to retry");
  })();

  // Cache success (the vault id is stable); drop failures so a retry re-runs.
  inflight.set(
    deps.ownerAddress,
    p.catch((e) => {
      inflight.delete(deps.ownerAddress);
      throw e;
    }),
  );
  return inflight.get(deps.ownerAddress)!;
}

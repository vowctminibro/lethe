"use client";

/**
 * useMintArtwork — gasless (Enoki-sponsored) mint of an Artwork NFT.
 *
 * Flow: build the mint tx → POST /api/sponsor (create) → user signs the
 * sponsored bytes with their zkLogin wallet → POST /api/sponsor (execute).
 * The user never needs gas.
 *
 * Requires: NEXT_PUBLIC_ENOKI_API_KEY + ENOKI_SECRET_KEY set AND the mint
 * target added to the Enoki sponsorship allowlist (see MINT_TARGET in sui.ts).
 */

import { useCallback } from "react";
import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toBase64, fromBase64 } from "@mysten/sui/utils";
import { buildMintArtworkTx } from "./sui";

export interface MintInput {
  blobId: string;
  prompt: string;
  traits: string;
}

export interface MintResult {
  digest: string;
  /** Created Artwork object id (resolved from tx effects; may be null if the lookup lags). */
  objectId: string | null;
  /** The gas sponsor address that paid (proves gasless; null if the lookup lags). */
  gasOwner: string | null;
}

const ARTWORK_TYPE_SUFFIX = "::artwork::Artwork";

/** After execution, resolve the created Artwork id + gas sponsor from the tx. */
async function resolveMintReceipts(
  client: ReturnType<typeof useSuiClient>,
  digest: string,
): Promise<{ objectId: string | null; gasOwner: string | null }> {
  // The fullnode may lag a beat behind the sponsor's execute; retry briefly.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const tx = await client.getTransactionBlock({
        digest,
        options: { showObjectChanges: true, showInput: true },
      });
      let objectId: string | null = null;
      for (const ch of tx.objectChanges ?? []) {
        if (ch.type === "created" && String(ch.objectType ?? "").endsWith(ARTWORK_TYPE_SUFFIX)) {
          objectId = ch.objectId;
          break;
        }
      }
      const gasOwnerRaw = tx.transaction?.data?.gasData?.owner ?? null;
      const gasOwner = typeof gasOwnerRaw === "string" ? gasOwnerRaw : null;
      if (objectId || gasOwner) return { objectId, gasOwner };
    } catch {
      /* not indexed yet — retry */
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return { objectId: null, gasOwner: null };
}

export function useMintArtwork() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const mint = useCallback(
    async (input: MintInput): Promise<MintResult> => {
      if (!account) throw new Error("Sign in first");

      const tx = buildMintArtworkTx({ ...input, createdAtMs: Date.now() });
      tx.setSender(account.address);
      const kindBytes = await tx.build({ client, onlyTransactionKind: true });

      // 1. sponsor (server holds the Enoki secret + pays gas)
      const sponsorRes = await fetch("/api/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          sender: account.address,
          transactionKindBytes: toBase64(kindBytes),
        }),
      });
      if (!sponsorRes.ok) {
        const err = await sponsorRes.json().catch(() => ({}));
        throw new Error(err?.error ?? "Sponsorship failed");
      }
      const { bytes, digest } = await sponsorRes.json();

      // 2. user signs the sponsored transaction with their zkLogin wallet
      const { signature } = await signTransaction({
        transaction: Transaction.from(fromBase64(bytes)),
      });

      // 3. execute via the sponsor
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
      const { objectId, gasOwner } = await resolveMintReceipts(client, finalDigest);
      return { digest: finalDigest, objectId, gasOwner };
    },
    [account, client, signTransaction],
  );

  return { mint, address: account?.address ?? null };
}

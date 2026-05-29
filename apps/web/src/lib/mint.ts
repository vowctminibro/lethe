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
      return { digest: finalDigest };
    },
    [account, client, signTransaction],
  );

  return { mint, address: account?.address ?? null };
}

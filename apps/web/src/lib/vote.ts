"use client";

/**
 * Gasless (Enoki-sponsored) battle actions — same path as mint.
 *
 * Gated by NEXT_PUBLIC_BATTLE_VOTE_ALLOWLISTED. Until the `::battle::vote` /
 * `::battle::create_battle` targets are on the Enoki allowlist, /api/sponsor
 * errors here (proving the path is wired, failing only at the allowlist gate).
 * Flip the flag after the portal step → works with no code change.
 */

import { useCallback } from "react";
import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toBase64, fromBase64 } from "@mysten/sui/utils";
import { buildVoteTx, buildCreateBattleTx } from "./battle";

export const VOTE_ALLOWLISTED = process.env.NEXT_PUBLIC_BATTLE_VOTE_ALLOWLISTED === "true";

export function useBattleActions() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const run = useCallback(
    async (tx: Transaction): Promise<{ digest: string }> => {
      if (!account) throw new Error("Sign in first");
      tx.setSender(account.address);
      const kindBytes = await tx.build({ client, onlyTransactionKind: true });

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

      const { signature } = await signTransaction({
        transaction: Transaction.from(fromBase64(bytes)),
      });

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

  const vote = useCallback(
    (battleId: string, side: 0 | 1) => run(buildVoteTx({ battleId, side })),
    [run],
  );

  const createBattle = useCallback(
    (artworkA: string, artworkB: string) =>
      run(buildCreateBattleTx({ artworkA, artworkB, createdAtMs: Date.now() })),
    [run],
  );

  return { vote, createBattle, address: account?.address ?? null, allowlisted: VOTE_ALLOWLISTED };
}

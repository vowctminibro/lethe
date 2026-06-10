"use client";

/**
 * useVaultBirth — the 0:00–0:15 hero moment as a hook.
 *
 * Watches the zkLogin session. On the first session without a Memory vault it
 * mints one (gasless, sponsored) and reports `born` with the create-tx digest so
 * the UI can celebrate "your vault now exists on Sui" with live explorer links.
 * Returning users skip creation and land in `ready`. Creation is deduped
 * app-wide in ensureVault, so mounting this hook on several pages is safe.
 */

import { useCallback, useEffect, useState } from "react";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { ensureVault, type SignFn } from "./gasless";

export type VaultBirth =
  | { phase: "signed-out" }
  | { phase: "checking" }
  | { phase: "creating" }
  | { phase: "born"; vaultId: string; digest: string | null }
  | { phase: "ready"; vaultId: string }
  | { phase: "error"; message: string };

export function useVaultBirth(): VaultBirth & { retry: () => void } {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const [state, setState] = useState<VaultBirth>({ phase: "signed-out" });
  const [nonce, setNonce] = useState(0);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!account) {
      setState({ phase: "signed-out" });
      return;
    }
    let cancelled = false;
    setState({ phase: "checking" });

    // ensureVault resolves instantly for returning users; flip to "creating"
    // only if it's still pending after a beat, so returners never see a flash.
    const slow = setTimeout(() => {
      if (!cancelled) setState((s) => (s.phase === "checking" ? { phase: "creating" } : s));
    }, 1500);

    ensureVault({ ownerAddress: account.address, client, signTransaction: signTransaction as SignFn })
      .then((v) => {
        if (cancelled) return;
        setState(
          v.justCreated
            ? { phase: "born", vaultId: v.vaultId, digest: v.digest }
            : { phase: "ready", vaultId: v.vaultId },
        );
      })
      .catch((e) => {
        if (cancelled) return;
        setState({ phase: "error", message: e instanceof Error ? e.message : "Couldn't reach Sui" });
      })
      .finally(() => clearTimeout(slow));

    return () => {
      cancelled = true;
      clearTimeout(slow);
    };
  }, [account, client, signTransaction, nonce]);

  return { ...state, retry };
}

/**
 * Memory layer — public surface + provider factory + React hook.
 *
 * The factory picks an implementation from NEXT_PUBLIC_MEMORY_PROVIDER
 * (default "manual"). `useMemory()` binds a ManualProvider to the live zkLogin
 * account + Sui client + signer, so components just call
 * `remember/recall/grant/revoke`.
 */

"use client";

import { useMemo } from "react";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import type { MemoryProvider } from "./provider";
import { ManualProvider, type SignFn } from "./manual-provider";
import { MemWalProvider } from "./memwal-provider";

export type { MemoryProvider } from "./provider";
export type { MemoryEntry, RememberResult, RecallHit, BlobRef } from "./types";
export { getOwnedMemory, MEMORY_PACKAGE_ID, MEMORY_ALLOWLISTED } from "./chain";
export type { OwnedMemory } from "./chain";

export type ProviderKind = "manual" | "memwal";

export function selectedProviderKind(): ProviderKind {
  return (process.env.NEXT_PUBLIC_MEMORY_PROVIDER ?? "manual") === "memwal"
    ? "memwal"
    : "manual";
}

/**
 * Hook: a MemoryProvider bound to the signed-in user, or null until signed in.
 * Recreated only when the account/client/signer change.
 */
export function useMemory(namespace?: string): MemoryProvider | null {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();

  return useMemo(() => {
    if (!account) return null;
    if (selectedProviderKind() === "memwal") return new MemWalProvider();
    return new ManualProvider({
      ownerAddress: account.address,
      client,
      signTransaction: signTransaction as SignFn,
      namespace,
    });
  }, [account, client, signTransaction, namespace]);
}

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
import {
  useCurrentAccount,
  useSuiClient,
  useSignTransaction,
  useSignPersonalMessage,
} from "@mysten/dapp-kit";
import type { MemoryProvider } from "./provider";
import { ManualProvider, type SignFn } from "./manual-provider";
import { SealProvider } from "./seal-provider";
import { MemWalProvider } from "./memwal-provider";
import { DEMO_MOCK, getMockProvider } from "../demo/mock";

export type { MemoryProvider } from "./provider";
export type { MemoryEntry, RememberResult, RecallHit, BlobRef } from "./types";
export { getOwnedMemory, MEMORY_PACKAGE_ID, MEMORY_ALLOWLISTED } from "./chain";
export type { OwnedMemory } from "./chain";

export type ProviderKind = "manual" | "seal" | "memwal";

export function selectedProviderKind(): ProviderKind {
  const v = process.env.NEXT_PUBLIC_MEMORY_PROVIDER ?? "manual";
  return v === "seal" ? "seal" : v === "memwal" ? "memwal" : "manual";
}

/**
 * Hook: a MemoryProvider bound to the signed-in user, or null until signed in.
 * Recreated only when the account/client/signer change.
 */
export function useMemory(namespace?: string): MemoryProvider | null {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  return useMemo(() => {
    if (DEMO_MOCK) return getMockProvider();
    if (!account) return null;
    const kind = selectedProviderKind();
    if (kind === "memwal") return new MemWalProvider();
    const deps = {
      ownerAddress: account.address,
      client,
      signTransaction: signTransaction as SignFn,
      namespace,
    };
    if (kind === "seal") {
      return new SealProvider({
        ...deps,
        signPersonalMessage: (input) => signPersonalMessage(input),
      });
    }
    return new ManualProvider(deps);
  }, [account, client, signTransaction, signPersonalMessage, namespace]);
}

/**
 * Enoki — zkLogin (Google) integration for Sui.
 *
 * v1.0.8 API note: the old `EnokiFlow` class and `@mysten/enoki/react`
 * provider are DEPRECATED. The supported path is `registerEnokiWallets`,
 * which plugs Enoki zkLogin in as a wallet for @mysten/dapp-kit. Once
 * registered, the signed-in zkLogin identity is just the current wallet
 * account — read its Sui address via dapp-kit's `useCurrentAccount`.
 *
 * Day 3 scope: provider wiring + an address getter only. The Google
 * sign-in button / OAuth callback UI comes later.
 * Docs: https://docs.enoki.mystenlabs.com
 */

import { registerEnokiWallets } from "@mysten/enoki";
import { useCurrentAccount } from "@mysten/dapp-kit";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

export type EnokiNetwork = "mainnet" | "testnet" | "devnet";

export const ENOKI_API_KEY = process.env.NEXT_PUBLIC_ENOKI_API_KEY ?? "";
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
export const SUI_NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet") as EnokiNetwork;

/** True only when the Enoki API key + Google client id are both present. */
export function isEnokiConfigured(): boolean {
  return ENOKI_API_KEY.length > 0 && GOOGLE_CLIENT_ID.length > 0;
}

/**
 * Register the Enoki zkLogin wallet(s) against the app's Sui client.
 * Call once after the dapp-kit providers mount; returns an `unregister`
 * cleanup. No-op (returns a noop cleanup) if Enoki isn't configured yet,
 * so the app still renders without the API key set.
 */
export function registerLetheEnokiWallets(client: SuiJsonRpcClient): () => void {
  if (!isEnokiConfigured()) {
    return () => {};
  }
  const { unregister } = registerEnokiWallets({
    apiKey: ENOKI_API_KEY,
    client,
    network: SUI_NETWORK,
    providers: {
      google: { clientId: GOOGLE_CLIENT_ID },
    },
  });
  return unregister;
}

/**
 * Getter: the current user's zkLogin Sui address, or null if not signed in.
 * This is a React hook (the account lives in dapp-kit context) — call it from
 * a client component. Returns null until a zkLogin session is connected.
 */
export function useZkLoginAddress(): string | null {
  const account = useCurrentAccount();
  return account?.address ?? null;
}

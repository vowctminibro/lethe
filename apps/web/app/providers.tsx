"use client";

/**
 * App-wide client providers: react-query + dapp-kit (Sui client + wallet),
 * with Enoki zkLogin wallets registered on top.
 *
 * Order matters: QueryClientProvider → SuiClientProvider → WalletProvider.
 * RegisterEnoki sits inside SuiClientProvider so it can read the live Sui
 * client via useSuiClient and register the Enoki wallet against it.
 */

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SuiClientProvider,
  WalletProvider,
  useSuiClient,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { registerLetheEnokiWallets, SUI_NETWORK } from "@/src/lib/enoki";

const { networkConfig } = createNetworkConfig({
  testnet: { url: getJsonRpcFullnodeUrl("testnet"), network: "testnet" },
  mainnet: { url: getJsonRpcFullnodeUrl("mainnet"), network: "mainnet" },
});

const defaultNetwork = SUI_NETWORK === "mainnet" ? "mainnet" : "testnet";

function RegisterEnoki() {
  const client = useSuiClient();
  useEffect(() => registerLetheEnokiWallets(client), [client]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per app instance (kept stable across re-renders).
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={defaultNetwork}>
        <WalletProvider autoConnect>
          <RegisterEnoki />
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

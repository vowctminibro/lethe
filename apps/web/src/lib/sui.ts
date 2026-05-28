/**
 * Sui client setup via @mysten/sui/jsonRpc.
 *
 * v2 SDK API note:
 *   - @mysten/sui v2 exports `SuiJsonRpcClient` from `@mysten/sui/jsonRpc`
 *   - NOT the old `SuiClient` from `@mysten/sui/client` (v1 API)
 *
 * Usage:
 *   import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
 *   const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl("testnet") });
 */

import {
  SuiJsonRpcClient,
  getJsonRpcFullnodeUrl,
} from "@mysten/sui/jsonRpc";

// Singleton client — created once, reused across the app
let _client: SuiJsonRpcClient | null = null;

/**
 * Get (or create) the shared Sui JSON-RPC client.
 * Network is read from NEXT_PUBLIC_SUI_NETWORK env var (default: testnet).
 */
export function getSuiClient(): SuiJsonRpcClient {
  if (!_client) {
    // Cast to the narrower literal type accepted by getJsonRpcFullnodeUrl
    const network = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet") as
      | "mainnet"
      | "testnet"
      | "devnet"
      | "localnet";
    _client = new SuiJsonRpcClient({
      network,
      url: getJsonRpcFullnodeUrl(network),
    });
  }
  return _client;
}

/**
 * The deployed Story NFT Move package ID.
 * Set via NEXT_PUBLIC_STORY_NFT_PACKAGE_ID env var after `sui client publish`.
 */
export const STORY_NFT_PACKAGE_ID =
  process.env.NEXT_PUBLIC_STORY_NFT_PACKAGE_ID ?? "";

/**
 * Sui client + Artwork NFT helpers.
 *
 * v2 SDK: client is `SuiJsonRpcClient` from `@mysten/sui/jsonRpc`.
 * Transaction building uses `@mysten/sui/transactions`.
 */

import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";

// ─── Client ───────────────────────────────────────────────────────────

let _client: SuiJsonRpcClient | null = null;

export function getSuiClient(): SuiJsonRpcClient {
  if (!_client) {
    const network = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet") as
      | "mainnet"
      | "testnet"
      | "devnet"
      | "localnet";
    _client = new SuiJsonRpcClient({ network, url: getJsonRpcFullnodeUrl(network) });
  }
  return _client;
}

// ─── Artwork package ──────────────────────────────────────────────────

/** Deployed lethe::artwork package id (set after `sui client publish`). */
export const ARTWORK_PACKAGE_ID = process.env.NEXT_PUBLIC_ARTWORK_PACKAGE_ID ?? "";

/** Fully-qualified mint target — this is what must be added to the Enoki allowlist. */
export const MINT_TARGET = ARTWORK_PACKAGE_ID ? `${ARTWORK_PACKAGE_ID}::artwork::mint` : "";

/** Fully-qualified Artwork struct type, for owned-object queries. */
export const ARTWORK_TYPE = ARTWORK_PACKAGE_ID ? `${ARTWORK_PACKAGE_ID}::artwork::Artwork` : "";

export interface MintArtworkArgs {
  blobId: string;
  prompt: string;
  traits: string;
  createdAtMs: number;
}

/** Build the `artwork::mint` transaction (sender is set by the caller). */
export function buildMintArtworkTx(args: MintArtworkArgs): Transaction {
  if (!ARTWORK_PACKAGE_ID) throw new Error("Missing NEXT_PUBLIC_ARTWORK_PACKAGE_ID");
  const tx = new Transaction();
  tx.moveCall({
    target: MINT_TARGET,
    arguments: [
      tx.pure.string(args.blobId),
      tx.pure.string(args.prompt),
      tx.pure.string(args.traits),
      tx.pure.u64(BigInt(args.createdAtMs)),
    ],
  });
  return tx;
}

// ─── Owned artworks (for /me) ─────────────────────────────────────────

export interface OwnedArtwork {
  objectId: string;
  blobId: string;
  prompt: string;
  traits: string;
  creator: string;
  createdAtMs: number;
}

/** List Artwork objects owned by an address, newest first. */
export async function getOwnedArtworks(
  client: SuiJsonRpcClient,
  owner: string,
): Promise<OwnedArtwork[]> {
  if (!ARTWORK_TYPE) return [];
  const res = await client.getOwnedObjects({
    owner,
    filter: { StructType: ARTWORK_TYPE },
    options: { showContent: true },
  });

  const items: OwnedArtwork[] = [];
  for (const entry of res.data ?? []) {
    const content = entry.data?.content;
    if (!content || content.dataType !== "moveObject") continue;
    const f = content.fields as Record<string, unknown>;
    items.push({
      objectId: String(entry.data?.objectId ?? ""),
      blobId: String(f.image_blob_id ?? ""),
      prompt: String(f.prompt ?? ""),
      traits: String(f.traits ?? ""),
      creator: String(f.creator ?? ""),
      createdAtMs: Number(f.created_at_ms ?? 0),
    });
  }
  items.sort((a, b) => b.createdAtMs - a.createdAtMs);
  return items;
}

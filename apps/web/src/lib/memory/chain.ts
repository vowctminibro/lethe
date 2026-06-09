/**
 * memory::memory on-chain helpers — tx builders + owned-object reads.
 *
 * Mirrors the mint/battle pattern: pure tx builders here, executed through the
 * Enoki sponsor flow (gasless). The `Memory` object is address-owned: each user
 * has at most one, minted via `create` right after zkLogin sign-in.
 */

import { Transaction } from "@mysten/sui/transactions";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import type { BlobRef } from "./types";

export const MEMORY_PACKAGE_ID = process.env.NEXT_PUBLIC_MEMORY_PACKAGE_ID ?? "";

/** Fully-qualified Move call targets — these are what must be Enoki-allowlisted. */
export const CREATE_TARGET = MEMORY_PACKAGE_ID ? `${MEMORY_PACKAGE_ID}::memory::create` : "";
export const ADD_ENTRY_TARGET = MEMORY_PACKAGE_ID ? `${MEMORY_PACKAGE_ID}::memory::add_entry` : "";
export const GRANT_TARGET = MEMORY_PACKAGE_ID ? `${MEMORY_PACKAGE_ID}::memory::grant` : "";
export const REVOKE_TARGET = MEMORY_PACKAGE_ID ? `${MEMORY_PACKAGE_ID}::memory::revoke` : "";

/** The Memory struct type, for owned-object queries. */
export const MEMORY_TYPE = MEMORY_PACKAGE_ID ? `${MEMORY_PACKAGE_ID}::memory::Memory` : "";

/** True once the targets are configured AND added to the Enoki allowlist. */
export const MEMORY_ALLOWLISTED =
  (process.env.NEXT_PUBLIC_MEMORY_ALLOWLISTED ?? "").toLowerCase() === "true";

/** Build a `memory::create` tx (mint an empty owned Memory; sender set by caller). */
export function buildCreateMemoryTx(): Transaction {
  if (!MEMORY_PACKAGE_ID) throw new Error("Missing NEXT_PUBLIC_MEMORY_PACKAGE_ID");
  const tx = new Transaction();
  tx.moveCall({ target: CREATE_TARGET });
  return tx;
}

/** Build a `memory::add_entry` tx appending one Walrus blob ref. Owner-only on chain. */
export function buildAddEntryTx(args: { memoryId: string; ref: BlobRef }): Transaction {
  if (!MEMORY_PACKAGE_ID) throw new Error("Missing NEXT_PUBLIC_MEMORY_PACKAGE_ID");
  const tx = new Transaction();
  tx.moveCall({
    target: ADD_ENTRY_TARGET,
    arguments: [
      tx.object(args.memoryId),
      tx.pure.string(args.ref.blobId),
      tx.pure.string(args.ref.namespace),
      tx.pure.string(args.ref.kind),
      tx.pure.u64(BigInt(args.ref.createdAtMs)),
    ],
  });
  return tx;
}

/** Build a `memory::grant` tx (give an app read access). Owner-only on chain. */
export function buildGrantTx(args: { memoryId: string; app: string }): Transaction {
  if (!MEMORY_PACKAGE_ID) throw new Error("Missing NEXT_PUBLIC_MEMORY_PACKAGE_ID");
  const tx = new Transaction();
  tx.moveCall({ target: GRANT_TARGET, arguments: [tx.object(args.memoryId), tx.pure.address(args.app)] });
  return tx;
}

/** Build a `memory::revoke` tx (cut an app's read access = forget). Owner-only. */
export function buildRevokeTx(args: { memoryId: string; app: string }): Transaction {
  if (!MEMORY_PACKAGE_ID) throw new Error("Missing NEXT_PUBLIC_MEMORY_PACKAGE_ID");
  const tx = new Transaction();
  tx.moveCall({ target: REVOKE_TARGET, arguments: [tx.object(args.memoryId), tx.pure.address(args.app)] });
  return tx;
}

/** The decoded on-chain state of a user's Memory object. */
export interface OwnedMemory {
  objectId: string;
  owner: string;
  entries: BlobRef[];
  authorized: string[];
}

interface RawBlobRefFields {
  blob_id?: string;
  namespace?: string;
  kind?: string;
  created_at_ms?: string | number;
}

/**
 * Find the caller's owned Memory object (each address has at most one), decoded.
 * Returns null if the user has no Memory yet.
 */
export async function getOwnedMemory(
  client: SuiJsonRpcClient,
  owner: string,
): Promise<OwnedMemory | null> {
  if (!MEMORY_TYPE) return null;
  const res = await client.getOwnedObjects({
    owner,
    filter: { StructType: MEMORY_TYPE },
    options: { showContent: true },
  });

  for (const entry of res.data ?? []) {
    const content = entry.data?.content;
    if (!content || content.dataType !== "moveObject") continue;
    const f = content.fields as Record<string, unknown>;

    // Move vectors of structs come back as arrays of { fields } (or bare objects
    // depending on the rpc); normalize both shapes.
    const rawEntries = (f.entries as unknown[]) ?? [];
    const entries: BlobRef[] = rawEntries.map((e) => {
      const ef = ((e as { fields?: RawBlobRefFields })?.fields ?? e) as RawBlobRefFields;
      return {
        blobId: String(ef.blob_id ?? ""),
        namespace: String(ef.namespace ?? ""),
        kind: String(ef.kind ?? ""),
        createdAtMs: Number(ef.created_at_ms ?? 0),
      };
    });

    return {
      objectId: String(entry.data?.objectId ?? ""),
      owner: String(f.owner ?? owner),
      entries,
      authorized: ((f.authorized as string[]) ?? []).map(String),
    };
  }
  return null;
}

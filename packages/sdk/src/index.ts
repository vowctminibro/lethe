// @lethe/sdk — read Lethe memory vaults from your app ("Continue with Lethe").
//
// Honest scope (testnet, v0.1): this SDK wraps the SAME paths the Pulse demo
// app uses —
//   1. on-chain reads of the vault object (public metadata: blob refs +
//      authorized apps), straight from a Sui fullnode;
//   2. the server-mediated grant-gated read for decrypted entries.
// Why server-mediated: Seal key servers evaluate decrypt policies via
// dry-run, and dry-runs reject address-OWNED objects for non-owner senders —
// so a third-party app cannot yet run its own decrypt session against a
// user's owned vault. Independent app decrypt sessions arrive with the
// shared-registry policy (roadmap). Until then your app reads through a
// grant-enforcing endpoint, exactly like Pulse.
//
// In-repo package — not published to npm yet. Install via the workspace.

import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

/** The first/original package id — vault TYPES are anchored to it forever. */
export const MEMORY_PACKAGE_ORIGINAL =
  "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";

/** One memory entry's on-chain reference (ciphertext lives on Walrus). */
export interface VaultEntry {
  blobId: string;
  namespace: string;
  kind: string;
  createdAtMs: number;
  /** Fetch the (encrypted) blob from any public Walrus aggregator. */
  walrusUrl: string;
}

/** The user's vault: ownership, entry refs, and the live grant list. */
export interface Vault {
  objectId: string;
  owner: string;
  entries: VaultEntry[];
  /** App addresses currently authorized to read (revocable live). */
  authorized: string[];
  suiscanUrl: string;
}

/** A decrypted entry returned by the server-mediated grant path. */
export interface GrantedEntry {
  text: string;
  kind: string;
  blobId: string;
  createdAtMs: number;
  /** True when the blob is Seal-encrypted and only decryptable client-side by the owner. */
  sealed?: boolean;
}

export interface LetheClientOptions {
  /** Sui fullnode URL. Default: testnet public fullnode. */
  fullnodeUrl?: string;
  /** Lethe app base URL for the server-mediated read. Default: the live testnet app. */
  appBaseUrl?: string;
  /** Walrus aggregator for blob links. Default: public testnet aggregator. */
  aggregatorUrl?: string;
}

interface MoveVaultFields {
  owner: string;
  entries: { fields: { blob_id: string; namespace: string; kind: string; created_at_ms: string } }[];
  authorized: string[];
}

export class LetheClient {
  readonly sui: SuiJsonRpcClient;
  readonly appBaseUrl: string;
  readonly aggregatorUrl: string;

  constructor(opts: LetheClientOptions = {}) {
    this.sui = new SuiJsonRpcClient({
      network: "testnet",
      url: opts.fullnodeUrl ?? getJsonRpcFullnodeUrl("testnet"),
    });
    this.appBaseUrl = (opts.appBaseUrl ?? "https://lethe-gold.vercel.app").replace(/\/$/, "");
    this.aggregatorUrl = (
      opts.aggregatorUrl ?? "https://aggregator.walrus-testnet.walrus.space"
    ).replace(/\/$/, "");
  }

  #toVault(objectId: string, fields: MoveVaultFields): Vault {
    return {
      objectId,
      owner: fields.owner,
      entries: fields.entries.map(({ fields: f }) => ({
        blobId: f.blob_id,
        namespace: f.namespace,
        kind: f.kind,
        createdAtMs: Number(f.created_at_ms),
        walrusUrl: `${this.aggregatorUrl}/v1/blobs/${encodeURIComponent(f.blob_id)}`,
      })),
      authorized: fields.authorized,
      suiscanUrl: `https://suiscan.xyz/testnet/object/${objectId}`,
    };
  }

  /** The owner's memory vault (public on-chain metadata), or null. */
  async getVaultByOwner(address: string): Promise<Vault | null> {
    const res = await this.sui.jsonRpc.getOwnedObjects({
      owner: address,
      filter: { StructType: `${MEMORY_PACKAGE_ORIGINAL}::memory::Memory` },
      options: { showContent: true },
      limit: 1,
    });
    const obj = res.data?.[0]?.data;
    if (!obj?.content || obj.content.dataType !== "moveObject") return null;
    return this.#toVault(obj.objectId, obj.content.fields as unknown as MoveVaultFields);
  }

  /** A vault by its object id (public on-chain metadata). */
  async listEntries(vaultId: string): Promise<Vault | null> {
    const res = await this.sui.jsonRpc.getObject({ id: vaultId, options: { showContent: true } });
    const obj = res.data;
    if (!obj?.content || obj.content.dataType !== "moveObject") return null;
    return this.#toVault(obj.objectId, obj.content.fields as unknown as MoveVaultFields);
  }

  /**
   * Server-mediated grant-gated read — the pattern Pulse runs in production.
   * Returns decrypted entries when the serving app's address holds an ACTIVE
   * grant on the owner's vault; throws GrantDeniedError on revoked/ungranted
   * (HTTP 403). `sealed: true` entries are Seal blobs only the owner's own
   * session can decrypt (see module header).
   */
  async requestReadAsGrantee(args: { ownerAddress: string }): Promise<{
    entries: GrantedEntry[];
    vaultId: string;
  }> {
    const res = await fetch(`${this.appBaseUrl}/api/pulse/recall`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerAddress: args.ownerAddress }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      entries?: GrantedEntry[];
      vaultId?: string;
      error?: string;
    };
    if (res.status === 403) throw new GrantDeniedError(body.error ?? "grant revoked or never given", body.vaultId);
    if (!res.ok) throw new Error(body.error ?? `read failed: HTTP ${res.status}`);
    return { entries: body.entries ?? [], vaultId: body.vaultId ?? "" };
  }
}

/** The owner has not granted (or has revoked) the serving app. */
export class GrantDeniedError extends Error {
  readonly vaultId?: string;
  constructor(message: string, vaultId?: string) {
    super(message);
    this.name = "GrantDeniedError";
    this.vaultId = vaultId;
  }
}

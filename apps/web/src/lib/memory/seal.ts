/**
 * Seal layer — Mysten Seal threshold encryption for Lethe memories.
 *
 * Lethe USES Seal (Mysten infrastructure, like Walrus and zkLogin): blobs are
 * encrypted client-side under the identity `[original pkg][vault id][nonce]`;
 * key servers release decryption keys only after `memory_policy::seal_approve`
 * dry-runs clean on-chain (owner or active grant — see contracts/memory).
 * The Lethe server never sees plaintext or key material in this mode.
 *
 * Two package ids matter (Seal SDK enforces this split — see PROGRESS Block 8):
 *  - ORIGINAL (first version): the identity namespace; encrypt() and
 *    SessionKey.create() hard-require it.
 *  - LATEST (current upgrade): where memory_policy lives; the seal_approve
 *    PTB must target it. Key servers normalize it back to ORIGINAL.
 *
 * Isomorphic: used by the browser provider AND node e2e scripts. No React,
 * no dapp-kit imports here.
 */

import { SealClient, SessionKey, EncryptedObject } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex, toHex } from "@mysten/sui/utils";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { MEMORY_PACKAGE_ID, MEMORY_PACKAGE_ORIGINAL } from "./chain";

/** Verified testnet decentralized key server (seal-docs.wal.app/Pricing). */
const DEFAULT_KEY_SERVER = "0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98";
const DEFAULT_AGGREGATOR = "https://seal-aggregator-testnet.mystenlabs.com";

export const SEAL_KEY_SERVERS = [
  {
    objectId: process.env.NEXT_PUBLIC_SEAL_KEY_SERVER_ID || DEFAULT_KEY_SERVER,
    aggregatorUrl: process.env.NEXT_PUBLIC_SEAL_AGGREGATOR_URL || DEFAULT_AGGREGATOR,
    weight: 1,
  },
];
export const SEAL_THRESHOLD = 1;

/** How long one signed session may keep fetching decryption keys. */
export const SESSION_TTL_MIN = 30;

const clients = new WeakMap<SuiJsonRpcClient, SealClient>();

/** One SealClient per Sui client — derived-key cache lives for the page. */
export function getSealClient(suiClient: SuiJsonRpcClient): SealClient {
  let c = clients.get(suiClient);
  if (!c) {
    c = new SealClient({ suiClient, serverConfigs: SEAL_KEY_SERVERS, verifyKeyServers: false });
    clients.set(suiClient, c);
  }
  return c;
}

/** Identity for one blob: [vault object id][8-byte nonce], hex w/o 0x. */
export function newIdentity(vaultId: string): string {
  return vaultId.replace(/^0x/, "") + toHex(crypto.getRandomValues(new Uint8Array(8)));
}

/** Encrypt one memory payload for a vault. Returns BCS EncryptedObject bytes. */
export async function sealEncrypt(
  suiClient: SuiJsonRpcClient,
  vaultId: string,
  plaintext: string,
): Promise<Uint8Array> {
  const { encryptedObject } = await getSealClient(suiClient).encrypt({
    threshold: SEAL_THRESHOLD,
    packageId: MEMORY_PACKAGE_ORIGINAL,
    id: newIdentity(vaultId),
    data: new TextEncoder().encode(plaintext),
  });
  return encryptedObject;
}

/**
 * The seal_approve PTB — key servers dry-run this and read the REQUESTED ids
 * out of the PTB's call args, so a batch needs one seal_approve call per id.
 */
export async function buildApproveTxBytes(
  suiClient: SuiJsonRpcClient,
  vaultId: string,
  idsHex: string[],
): Promise<Uint8Array> {
  const tx = new Transaction();
  for (const idHex of idsHex) {
    tx.moveCall({
      target: `${MEMORY_PACKAGE_ID}::memory_policy::seal_approve`,
      arguments: [tx.pure.vector("u8", fromHex(idHex)), tx.object(vaultId)],
    });
  }
  return tx.build({ client: suiClient, onlyTransactionKind: true });
}

/** Is this blob Seal-encrypted (vs legacy server-side AES)? */
export function parseSealBlob(bytes: Uint8Array): { id: string } | null {
  try {
    const parsed = EncryptedObject.parse(bytes);
    return { id: parsed.id };
  } catch {
    return null;
  }
}

/**
 * Decrypt a batch of Seal blobs for one vault with one approve-PTB and one
 * fetchKeys round (cheaper than per-blob decrypt).
 */
export async function sealDecryptBatch(
  suiClient: SuiJsonRpcClient,
  sessionKey: SessionKey,
  vaultId: string,
  blobs: { bytes: Uint8Array; id: string }[],
): Promise<(string | null)[]> {
  if (blobs.length === 0) return [];
  const seal = getSealClient(suiClient);
  const txBytes = await buildApproveTxBytes(
    suiClient,
    vaultId,
    blobs.map((b) => b.id),
  );
  await seal.fetchKeys({
    ids: blobs.map((b) => b.id),
    txBytes,
    sessionKey,
    threshold: SEAL_THRESHOLD,
  });
  return Promise.all(
    blobs.map(async (b) => {
      try {
        const out = await seal.decrypt({ data: b.bytes, sessionKey, txBytes });
        return new TextDecoder().decode(out);
      } catch {
        return null; // skip undecryptable blob, never fail the whole recall
      }
    }),
  );
}

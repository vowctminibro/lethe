/**
 * SessionKey management — one quiet signature per session, not per memory.
 *
 * Seal decryption needs a personal-message signature binding an ephemeral
 * session key to the user. To keep the gasless feel: the signed key is cached
 * (sessionStorage in the browser via SessionKey.export/import) for
 * SESSION_TTL_MIN, so a whole chat session signs AT MOST once. zkLogin signs
 * personal messages without a popup through the Enoki wallet, so in practice
 * the unlock is invisible — the UI shows a one-time "unlocking your
 * memories…" state while the first signature lands.
 *
 * Isomorphic: scripts pass a keypair-backed `signPersonalMessage`.
 */

import { SessionKey, type ExportedSessionKey } from "@mysten/seal";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { MEMORY_PACKAGE_ORIGINAL } from "./chain";
import { SESSION_TTL_MIN } from "./seal";

export type SignPersonalMessageFn = (input: {
  message: Uint8Array;
}) => Promise<{ signature: string }>;

const STORAGE_KEY = "lethe-seal-session";

function loadCached(suiClient: SuiJsonRpcClient, address: string): SessionKey | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const exported = JSON.parse(raw) as ExportedSessionKey;
    if (exported.address !== address || exported.packageId !== MEMORY_PACKAGE_ORIGINAL) return null;
    const key = SessionKey.import(exported, suiClient);
    return key.isExpired() ? null : key;
  } catch {
    return null;
  }
}

function saveCached(key: SessionKey) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(key.export()));
  } catch {
    /* storage full/blocked — we just re-sign next session */
  }
}

/** Drop the cached session (sign-out hygiene). */
export function clearSealSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// In-flight dedupe so parallel recalls don't trigger parallel signatures.
let pending: Promise<SessionKey> | null = null;

/**
 * Get a live signed SessionKey for the user, creating + signing one only when
 * the cache is empty or expired.
 */
export async function getSealSession(
  suiClient: SuiJsonRpcClient,
  address: string,
  signPersonalMessage: SignPersonalMessageFn,
): Promise<SessionKey> {
  const cached = loadCached(suiClient, address);
  if (cached) return cached;
  if (pending) return pending;

  pending = (async () => {
    const key = await SessionKey.create({
      address,
      packageId: MEMORY_PACKAGE_ORIGINAL,
      ttlMin: SESSION_TTL_MIN,
      suiClient,
    });
    const { signature } = await signPersonalMessage({ message: key.getPersonalMessage() });
    await key.setPersonalMessageSignature(signature);
    saveCached(key);
    return key;
  })();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}

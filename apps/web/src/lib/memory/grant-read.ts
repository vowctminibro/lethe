/**
 * grantGatedRead — the server-mediated, grant-gated memory read (SERVER-ONLY).
 *
 * The enforcement point for "revoke = forget": the server reads the owner's
 * Memory vault from chain and returns decrypted entries ONLY if the vault's
 * on-chain `authorized` vector contains the requesting app's address. Revoked
 * or never-granted → a 403 result with zero entries; a judge can verify the
 * `authorized` list live on Suiscan.
 *
 * Extracted from the Pulse route verbatim so ANY granted app/agent can use the
 * same path (generic broker). Trust model is unchanged from Pulse: Lethe's
 * server is the trusted intermediary that enforces the on-chain grant. It does
 * NOT cryptographically prove the caller IS that app — caller-identity proof
 * arrives with the shared-registry policy (roadmap). Seal blobs come back
 * `sealed: true` (only the owner's own session can decrypt them).
 */
import { getSuiClient } from "@/src/lib/sui";
import { getOwnedMemory } from "@/src/lib/memory/chain";
import { readBytes } from "@/src/lib/walrus";
import { getEncryptor } from "@/src/lib/memory/encryptor";
import { parseSealBlob } from "@/src/lib/memory/seal";

export interface GrantEntryRow {
  text: string;
  sealed: boolean;
  kind: string;
  blobId: string;
  createdAtMs: number;
}

export type GrantReadResult =
  | { ok: true; entries: GrantEntryRow[]; vaultId: string; authorized: string[] }
  | { ok: false; status: number; error: string; vaultId?: string };

export async function grantGatedRead(args: {
  ownerAddress: string;
  appAddress: string;
  /** Friendly label used in the 403 message, e.g. "Pulse". */
  appLabel?: string;
}): Promise<GrantReadResult> {
  const { ownerAddress, appAddress } = args;
  const label = args.appLabel ?? "This app";

  const vault = await getOwnedMemory(getSuiClient(), ownerAddress);
  if (!vault) {
    return { ok: false, status: 404, error: "no memory vault for this address" };
  }

  if (!vault.authorized.includes(appAddress)) {
    return { ok: false, status: 403, error: `${label} is not authorized on this vault`, vaultId: vault.objectId };
  }

  // Authorized on-chain → decrypt what the server can (legacy AES blobs). Seal
  // blobs cannot be decrypted here (that is the point of Seal mode) — they come
  // back flagged `sealed: true` for the owner's own session to decrypt.
  const encryptor = getEncryptor();
  const settled = await Promise.allSettled(
    vault.entries.map(async (ref) => {
      const bytes = await readBytes(ref.blobId);
      if (parseSealBlob(bytes)) {
        return { text: "", sealed: true, kind: ref.kind, blobId: ref.blobId, createdAtMs: ref.createdAtMs };
      }
      const plain = await encryptor.decrypt(bytes, ownerAddress);
      // Stored payload is { text, kind, createdAtMs }; tolerate older raw text.
      let text = plain;
      try {
        const parsed = JSON.parse(plain) as { text?: string };
        if (parsed && typeof parsed.text === "string") text = parsed.text;
      } catch {
        /* not JSON — treat the whole blob as the text */
      }
      return { text, sealed: false, kind: ref.kind, blobId: ref.blobId, createdAtMs: ref.createdAtMs };
    }),
  );

  const entries = settled
    .filter((s): s is PromiseFulfilledResult<GrantEntryRow> => s.status === "fulfilled")
    .map((s) => s.value)
    .sort((a, b) => b.createdAtMs - a.createdAtMs);

  return { ok: true, entries, vaultId: vault.objectId, authorized: vault.authorized };
}

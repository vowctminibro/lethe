import { NextRequest, NextResponse } from "next/server";
import { getSuiClient } from "@/src/lib/sui";
import { getOwnedMemory } from "@/src/lib/memory/chain";
import { readBytes } from "@/src/lib/walrus";
import { getEncryptor } from "@/src/lib/memory/encryptor";
import { PULSE_APP_ADDRESS } from "@/src/lib/pulse";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST { ownerAddress } -> { entries: {text,kind,blobId,createdAtMs}[], vaultId, authorized }
 *
 * Pulse's ONLY read path — and the enforcement point for "revoke = forget".
 * The server reads the owner's Memory vault from chain and decrypts entries
 * ONLY if the vault's on-chain `authorized` vector contains Pulse's app
 * address. Revoked (or never granted) → 403 with zero entries: Pulse knows
 * nothing, and a judge can verify the authorized list live on Suiscan.
 */
export async function POST(req: NextRequest) {
  try {
    const { ownerAddress } = await req.json();
    if (typeof ownerAddress !== "string" || !/^0x[0-9a-fA-F]+$/.test(ownerAddress)) {
      return NextResponse.json({ error: "missing/invalid ownerAddress" }, { status: 400 });
    }

    const vault = await getOwnedMemory(getSuiClient(), ownerAddress);
    if (!vault) {
      return NextResponse.json({ error: "no memory vault for this address" }, { status: 404 });
    }

    const granted = vault.authorized.includes(PULSE_APP_ADDRESS);
    if (!granted) {
      return NextResponse.json(
        { error: "Pulse is not authorized on this vault", vaultId: vault.objectId, entries: [] },
        { status: 403 },
      );
    }

    // Authorized on-chain → decrypt the entries (newest first, best-effort per blob).
    const encryptor = getEncryptor();
    const settled = await Promise.allSettled(
      vault.entries.map(async (ref) => {
        const bytes = await readBytes(ref.blobId);
        const plain = await encryptor.decrypt(bytes, ownerAddress);
        // Stored payload is { text, kind, createdAtMs }; tolerate older raw text.
        let text = plain;
        try {
          const parsed = JSON.parse(plain) as { text?: string };
          if (parsed && typeof parsed.text === "string") text = parsed.text;
        } catch {
          /* not JSON — treat the whole blob as the text */
        }
        return { text, kind: ref.kind, blobId: ref.blobId, createdAtMs: ref.createdAtMs };
      }),
    );
    const entries = settled
      .filter((s): s is PromiseFulfilledResult<{ text: string; kind: string; blobId: string; createdAtMs: number }> => s.status === "fulfilled")
      .map((s) => s.value)
      .sort((a, b) => b.createdAtMs - a.createdAtMs);

    return NextResponse.json({ entries, vaultId: vault.objectId, authorized: vault.authorized });
  } catch (e) {
    const message = e instanceof Error ? e.message : "pulse recall failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

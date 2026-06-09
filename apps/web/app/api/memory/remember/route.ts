import { NextRequest, NextResponse } from "next/server";
import { store } from "@/src/lib/walrus";
import { getEncryptor } from "@/src/lib/memory/encryptor";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST { ownerAddress, text, kind, namespace? }
 *   -> { blobId, namespace, kind, createdAtMs }
 *
 * Encrypts the entry for the owner (SEAL swap-point) and stores the ciphertext
 * on Walrus. The caller then references the returned blob on-chain via
 * `memory::add_entry` (gasless). The plaintext never touches the chain or a
 * public blob.
 */
export async function POST(req: NextRequest) {
  try {
    const { ownerAddress, text, kind, namespace } = await req.json();
    if (typeof ownerAddress !== "string" || !ownerAddress) {
      return NextResponse.json({ error: "missing ownerAddress" }, { status: 400 });
    }
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "missing text" }, { status: 400 });
    }

    const ns = typeof namespace === "string" && namespace ? namespace : "lethe";
    const entryKind = typeof kind === "string" && kind ? kind : "fact";
    const createdAtMs = Date.now();

    // Encrypt the structured entry, then store the ciphertext on Walrus.
    const payload = JSON.stringify({ text: text.trim(), kind: entryKind, createdAtMs });
    const ciphertext = await getEncryptor().encrypt(payload, ownerAddress);
    const blobId = await store(ciphertext);

    return NextResponse.json({ blobId, namespace: ns, kind: entryKind, createdAtMs });
  } catch (e) {
    const message = e instanceof Error ? e.message : "remember failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { store } from "@/src/lib/walrus";
import { fromBase64 } from "@mysten/sui/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST { ciphertextB64 } -> { blobId }
 *
 * Seal-mode store: a pure passthrough that pins ALREADY-ENCRYPTED bytes to
 * Walrus. The client encrypted with Seal before calling — this route never
 * sees plaintext or any key material. (Exists only because the public Walrus
 * publisher sits behind our server for rate-limit/abuse control; the
 * aggregator read path is browser-direct.)
 */
export async function POST(req: NextRequest) {
  try {
    const { ciphertextB64 } = await req.json();
    if (typeof ciphertextB64 !== "string" || !ciphertextB64) {
      return NextResponse.json({ error: "missing ciphertextB64" }, { status: 400 });
    }
    let bytes: Uint8Array;
    try {
      bytes = fromBase64(ciphertextB64);
    } catch {
      return NextResponse.json({ error: "invalid base64" }, { status: 400 });
    }
    // Memories are sub-KB; anything big is not a Lethe memory entry.
    if (bytes.length > 64 * 1024) {
      return NextResponse.json({ error: "ciphertext too large" }, { status: 413 });
    }
    const blobId = await store(bytes);
    return NextResponse.json({ blobId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "store failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

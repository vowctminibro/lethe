import { NextRequest, NextResponse } from "next/server";
import { readBytes } from "@/src/lib/walrus";
import { getEncryptor } from "@/src/lib/memory/encryptor";
import type { BlobRef, RecallHit } from "@/src/lib/memory/types";
import { scoreEntry } from "@/src/lib/memory/retrieval";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST { ownerAddress, query, refs: BlobRef[], limit? }
 *   -> { hits: RecallHit[] }
 *
 * Fetches each referenced blob from Walrus, decrypts it for the owner, scores it
 * against the query (lightweight keyword/overlap — semantic embeddings come with
 * MemWal/Seal later), and returns the best matches. Blobs that fail to fetch or
 * decrypt are skipped, not fatal.
 */
export async function POST(req: NextRequest) {
  try {
    const { ownerAddress, query, refs, limit } = await req.json();
    if (typeof ownerAddress !== "string" || !ownerAddress) {
      return NextResponse.json({ error: "missing ownerAddress" }, { status: 400 });
    }
    if (!Array.isArray(refs)) {
      return NextResponse.json({ error: "missing refs[]" }, { status: 400 });
    }

    const enc = getEncryptor();
    const q = typeof query === "string" ? query : "";

    const settled = await Promise.allSettled(
      (refs as BlobRef[]).map(async (ref): Promise<RecallHit> => {
        const bytes = await readBytes(ref.blobId);
        const plaintext = await enc.decrypt(bytes, ownerAddress);
        // Stored payload is { text, kind, createdAtMs }; tolerate older raw text.
        let text = plaintext;
        try {
          const parsed = JSON.parse(plaintext);
          if (parsed && typeof parsed.text === "string") text = parsed.text;
        } catch {
          /* not JSON — treat the whole blob as the text */
        }
        return {
          text,
          blobId: ref.blobId,
          namespace: ref.namespace,
          kind: ref.kind,
          createdAtMs: ref.createdAtMs,
          // Score against the text plus the semantic kind ("trading-style" →
          // "trading style"), so a query like "what's my trading style?" matches
          // even when those exact words aren't in the free text.
          score: scoreEntry(q, `${text} ${ref.kind.replace(/-/g, " ")}`),
        };
      }),
    );

    let hits = settled
      .filter((s): s is PromiseFulfilledResult<RecallHit> => s.status === "fulfilled")
      .map((s) => s.value);

    // With a real query, rank by score then recency; with no query, just recency.
    hits = q.trim()
      ? hits.sort((a, b) => b.score - a.score || b.createdAtMs - a.createdAtMs)
      : hits.sort((a, b) => b.createdAtMs - a.createdAtMs);

    const n = typeof limit === "number" && limit > 0 ? limit : hits.length;
    return NextResponse.json({ hits: hits.slice(0, n) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "recall failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest } from "next/server";

export const runtime = "nodejs";

const AGGREGATOR_URL = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL;

/**
 * Image proxy for Walrus blobs.
 *
 * The Walrus aggregator serves blob bytes with no Content-Type, so strict
 * image viewers can refuse to render `<img src=aggregator/...>` directly.
 * This route fetches the blob and re-serves it with a sniffed image MIME
 * (+ long cache), so owned artwork always renders.
 *
 * GET /api/img/<blobId>
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ blobId: string }> },
) {
  if (!AGGREGATOR_URL) {
    return new Response("aggregator not configured", { status: 500 });
  }
  const { blobId } = await params;
  if (!blobId) return new Response("missing blobId", { status: 400 });

  const res = await fetch(`${AGGREGATOR_URL}/v1/blobs/${encodeURIComponent(blobId)}`);
  if (!res.ok) {
    return new Response("blob not found", { status: 404 });
  }
  const buf = Buffer.from(await res.arrayBuffer());

  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": sniffImageMime(buf),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/** Sniff a content-type from the leading magic bytes; default to JPEG. */
function sniffImageMime(buf: Buffer): string {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.length >= 6 && buf.toString("ascii", 0, 3) === "GIF") return "image/gif";
  return "image/jpeg";
}

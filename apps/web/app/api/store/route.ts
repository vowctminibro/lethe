import { NextRequest, NextResponse } from "next/server";
import { store } from "@/src/lib/walrus";

export const runtime = "nodejs";
export const maxDuration = 60;

const AGGREGATOR_URL = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL;

/**
 * POST { imageBase64 } -> { blobId, aggregatorUrl }
 * Uploads the accepted image to Walrus (server-side to avoid browser CORS on
 * the publisher). The image lives on Walrus, not in the app.
 */
export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ error: "missing imageBase64" }, { status: 400 });
    }
    const bytes = new Uint8Array(Buffer.from(imageBase64, "base64"));
    const blobId = await store(bytes);
    return NextResponse.json({
      blobId,
      size: bytes.byteLength,
      aggregatorUrl: `${AGGREGATOR_URL}/v1/blobs/${blobId}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "walrus store failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

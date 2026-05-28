/**
 * Walrus blob storage via @mysten/walrus.
 * Docs: https://sdk.mystenlabs.com/walrus
 * NPM:  https://www.npmjs.com/package/@mysten/walrus
 *
 * Usage:
 *   import { uploadChapterBlob, retrieveChapterBlob } from "@/lib/walrus";
 */

const PUBLISHER_URL =
  process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL
  ?? "https://publisher.walrus-testnet.walrus.space";
const AGGREGATOR_URL =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL
  ?? "https://aggregator.walrus-testnet.walrus.space";

/**
 * Upload a story chapter (as UTF-8 text) to Walrus.
 * Returns the blob ID for later retrieval.
 *
 * TODO (Day 3): wire SuiClient signer for gas + WAL payment
 * TODO (Day 3): confirm writeFees are paid in SUI or WAL on testnet
 */
export async function uploadChapterBlob(
  content: string,
  _epochs = 3,
  _deletable = true,
): Promise<{ blobId: string }> {
  // ── placeholder — replace with @mysten/walrus writeFiles ──
  if (!content.trim()) throw new Error("Content cannot be empty");
  const blobId = `placeholder_blob_${Date.now()}`;
  console.info(`[Walrus] would upload to ${PUBLISHER_URL} → blobId=${blobId}`);
  return { blobId };
}

/**
 * Retrieve a chapter's content from Walrus by blob ID.
 */
export async function retrieveChapterBlob(
  blobId: string,
): Promise<string> {
  // ── placeholder — replace with @mysten/walrus getBlob / getFiles ──
  console.info(`[Walrus] would retrieve from ${AGGREGATOR_URL}/v1/blobs/${blobId}`);
  return "[Chapter content would be loaded from Walrus here]";
}

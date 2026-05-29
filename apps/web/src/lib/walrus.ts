/**
 * Walrus — decentralized blob storage for story chapters.
 *
 * Uses the testnet publisher/aggregator HTTP REST API (no SDK):
 *   - store:  PUT  {PUBLISHER_URL}/v1/blobs?epochs=N   (body = blob bytes)
 *   - read:   GET  {AGGREGATOR_URL}/v1/blobs/{blobId}
 *
 * The @mysten/walrus SDK is intentionally NOT used here: writing a blob via the
 * SDK fans out to ~2200 storage-node requests, whereas the publisher does that
 * server-side behind one HTTP call — the right tradeoff for app/PoC writes.
 * Endpoints come from .env (NEXT_PUBLIC_WALRUS_PUBLISHER_URL / _AGGREGATOR_URL).
 * Reference: research/audit-v2.md TASK 2
 */

const PUBLISHER_URL = process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL;
const AGGREGATOR_URL = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL;

/** Default storage duration. Testnet epochs are ~1 day each. */
const DEFAULT_EPOCHS = 5;

export interface StoreOptions {
  /** How many epochs to persist the blob. Defaults to DEFAULT_EPOCHS. */
  epochs?: number;
}

export interface ChapterBlob {
  blobId: string;
  size: number;
  uploadedAt: number;
}

/**
 * Store a blob on Walrus via the publisher and return its blobId.
 * The publisher response differs depending on whether the content is new
 * (`newlyCreated`) or already present on the network (`alreadyCertified`);
 * both carry the blobId we need.
 */
export async function store(
  data: string | Uint8Array | Blob,
  opts: StoreOptions = {},
): Promise<string> {
  if (!PUBLISHER_URL) throw new Error("Missing NEXT_PUBLIC_WALRUS_PUBLISHER_URL");

  const epochs = opts.epochs ?? DEFAULT_EPOCHS;
  const res = await fetch(`${PUBLISHER_URL}/v1/blobs?epochs=${epochs}`, {
    method: "PUT",
    body: data as BodyInit,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Walrus store failed: ${res.status} ${res.statusText} ${detail}`);
  }

  const json = await res.json();
  const blobId: string | undefined =
    json?.newlyCreated?.blobObject?.blobId ?? json?.alreadyCertified?.blobId;

  if (!blobId) {
    throw new Error(`Walrus store: no blobId in response: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return blobId;
}

/** Read a blob back from the aggregator as UTF-8 text. */
export async function read(blobId: string): Promise<string> {
  if (!AGGREGATOR_URL) throw new Error("Missing NEXT_PUBLIC_WALRUS_AGGREGATOR_URL");

  const res = await fetch(`${AGGREGATOR_URL}/v1/blobs/${blobId}`);
  if (!res.ok) {
    throw new Error(`Walrus read failed: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

/** Read a blob back as raw bytes (for images and other binary content). */
export async function readBytes(blobId: string): Promise<Uint8Array> {
  if (!AGGREGATOR_URL) throw new Error("Missing NEXT_PUBLIC_WALRUS_AGGREGATOR_URL");

  const res = await fetch(`${AGGREGATOR_URL}/v1/blobs/${blobId}`);
  if (!res.ok) {
    throw new Error(`Walrus read failed: ${res.status} ${res.statusText}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

/**
 * Store a chapter's text and return blob metadata.
 * Thin wrapper over store() used by the story orchestrator.
 */
export async function uploadChapterBlob(content: string): Promise<ChapterBlob> {
  const blobId = await store(content);
  return {
    blobId,
    size: new TextEncoder().encode(content).length,
    uploadedAt: Date.now(),
  };
}

/** Retrieve a chapter's text by blobId. Thin wrapper over read(). */
export async function retrieveChapterBlob(blobId: string): Promise<string> {
  return read(blobId);
}

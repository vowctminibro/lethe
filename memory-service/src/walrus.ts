/**
 * Walrus HTTP client (publisher/aggregator pattern — no SDK)
 * Publisher: https://publisher.walrus-testnet.walrus.space
 * Aggregator: https://aggregator.walrus-testnet.walrus.space
 */

const PUBLISHER = process.env.WALRUS_PUBLISHER ?? 'https://publisher.walrus-testnet.walrus.space';
const AGGREGATOR = process.env.WALRUS_AGGREGATOR ?? 'https://aggregator.walrus-testnet.walrus.space';
const EPOCHS = Number(process.env.WALRUS_EPOCHS ?? 20);

interface StoreNewlyCreated {
  newlyCreated: {
    blobObject: {
      blobId: string;
      id: string; // suiObjectId
    };
  };
}

interface StoreAlreadyCertified {
  alreadyCertified: {
    blobId: string;
    event: { txDigest: string };
  };
}

type StoreResponse = StoreNewlyCreated | StoreAlreadyCertified;

/**
 * Store a JSON-encodable object as a Walrus blob.
 * Returns { blobId, suiObjectId?, alreadyCertified }
 */
export async function storeBlob(
  content: object,
): Promise<{ blobId: string; suiObjectId?: string; alreadyCertified: boolean }> {
  const body = new TextEncoder().encode(JSON.stringify(content));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${PUBLISHER}/v1/blobs?epochs=${EPOCHS}`, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': 'application/octet-stream' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Walrus publisher returned ${res.status}: ${text}`);
    }

    const json = (await res.json()) as StoreResponse;

    if ('newlyCreated' in json) {
      return {
        blobId: json.newlyCreated.blobObject.blobId,
        suiObjectId: json.newlyCreated.blobObject.id,
        alreadyCertified: false,
      };
    } else {
      return {
        blobId: json.alreadyCertified.blobId,
        suiObjectId: undefined,
        alreadyCertified: true,
      };
    }
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Walrus publisher timeout after 30s');
    }
    throw err;
  }
}

/**
 * Fetch a blob from Walrus aggregator and parse as JSON.
 */
export async function fetchBlob(blobId: string): Promise<object> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Walrus aggregator returned ${res.status} for blob ${blobId}`);
    }

    const text = await res.text();
    return JSON.parse(text);
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Walrus aggregator timeout after 10s for blob ${blobId}`);
    }
    throw err;
  }
}

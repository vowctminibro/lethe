# Walrus Integration Notes

## Endpoints (testnet — public, no auth required)

| Role | Method | URL |
|------|--------|-----|
| Publisher (store blobs) | PUT | `https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=N` |
| Aggregator (read blobs) | GET | `https://aggregator.walrus-testnet.walrus.space/v1/blobs/:id` |

## Epoch math

- 1 epoch ≈ 2 days on testnet
- 20 epochs = ~40 days
- Deadline: Jun 21, 2026 → 20 epochs provides buffer through Jul 1
- For production: use `epochs=50` (~100 days)

## Blob storage request

```
PUT /v1/blobs?epochs=20
Content-Type: application/octet-stream
Body: raw bytes (JSON.stringify content → TextEncoder)

Response (newly created):
{
  "newlyCreated": {
    "blobObject": {
      "blobId": "...",
      "id": "0x..."  // suiObjectId
    }
  }
}

Response (already certified):
{
  "alreadyCertified": {
    "blobId": "...",
    "event": { "txDigest": "..." }
  }
}
```

## Blob schema v1

```typescript
interface BlobContent {
  v: 1;                                  // schema version
  npcId: string;                         // "khun-tum"
  playerWallet: string;                  // "0x..."
  event: string;                        // "stole 100 gold"
  metadata?: Record<string, unknown>;   // optional
  timestamp: number;                     // Date.now()
}
```

## No SDK — HTTP only

Using raw HTTP (`fetch` with AbortController timeout) instead of `@mysten/walrus`
SDK to avoid SDK version mismatch / API drift issues. The publisher/aggregator
API is simple enough that a thin wrapper is sufficient.

## Error handling

- Publisher 4xx/5xx → return 502 to client, do NOT proceed with Sui tx
- Aggregator 4xx/5xx → entry with `{ content: null, error: "blob_fetch_failed" }`
  (don't break the whole recall response)

## Monitoring

```bash
# Check publisher health
curl https://publisher.walrus-testnet.walrus.space/v1/system

# Check aggregator health
curl https://aggregator.walrus-testnet.walrus.space/v1/system

# Read a blob directly
curl https://aggregator.walrus-testnet.walrus.space/v1/blobs/<blobId>
```
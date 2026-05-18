# OnlyFins/Walrus Patterns

Extracted from: https://docs.sui.io/sui-stack/walrus/sui-stack-walrus

## Architecture Overview

OnlyFins is an encrypted social media demo built on Sui + Walrus + Seal:
- **Walrus**: stores images as blobs (public, content-addressed)
- **Seal**: threshold encryption tied to Sui object ownership (ViewerToken)
- **Sui**: coordinates payments, governance, and access control via onchain objects
- Each **Post** is a Sui object that stores a reference to the image blob

---

## 1. Blob Upload Patterns

### TS SDK Client Setup

```ts
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { walrus } from '@mysten/walrus';

const client = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: 'https://fullnode.testnet.sui.io:443',
}).$extend(walrus());
```

### Upload via Signer (server-side/backend)

Used in `createPosts.ts` — a backend script loads an Ed25519Keypair and builds a PTB to register each post onchain after images are uploaded via CLI.

Config pattern (`backend/src/config.ts`):
```ts
// Load Ed25519Keypair from environment variables
```

Post registration PTB (`backend/src/createPosts.ts`):
```ts
// PTB calls posts::create_post for each post
// Embeds the Walrus blob ID as image_blob_id field on the Post Sui object
```

### Upload via User Wallet (browser)

The `writeFilesFlow` method handles browser wallet uploads in 5 discrete steps:
1. `encode` — encode files, compute blob ID
2. `register` — return transaction that registers blob onchain
3. `upload` — upload data to storage nodes or relay
4. `certify` — return transaction that certifies the blob onchain
5. `listFiles` — return the list of created files

> Note: There is currently no example of this pattern in OnlyFins. References:
> - relay.wal.app (production-ready demo, open source)
> - `write-from-wallet` example in TS SDK repo

### Using Upload Relay (reduces 2,200 requests → 1)

Configure the upload relay when extending the client to reduce client requests:
```ts
// Configure upload relay in $extend(walrus()) options
```

### Batch Upload with WalrusFile API

```ts
// When uploading multiple files together, use writeFiles with WalrusFile.from()
// Attaches identifiers and tags to each file; more efficient than uploading separately
// See: 11-Batch-storage hands-on source
```

---

## 2. Blob ID → Sui Object Linking Pattern

### Two Identifiers Per Blob

| Identifier | Description |
|---|---|
| **Blob ID** | Content-addressed hash computed offchain from blob contents |
| **Object ID** | Sui object ID of the onchain blob registration record |

### OnlyFins Post Object

Each `Post` Sui object has an `image_blob_id` field storing the Walrus blob ID:

```
Post Sui object
  └── image_blob_id  ← Walrus blob ID (used to construct fetch URL)
  └── encryption_id  ← (optional) used in Seal decryption flow
```

### Reading: Blob ID → URL

The `transformSuiObjectsToPosts` utility:
1. Extracts `image_blob_id` from each Post Sui object
2. Constructs the aggregator URL for fetching
3. For encrypted posts, also extracts `encryption_id` for the decryption flow

```ts
// transformSuiObjectsToPosts extracts image_blob_id → constructs aggregator URL
// For encrypted posts: also extracts encryption_id for decryption
```

### Fetching Posts by ID

OnlyFins `Feed` component fetches known post object IDs via `multiGetObjects`:

```ts
// useSuiClientQuery with multiGetObjects — same pattern as fetching any Sui object by ID
```

---

## 3. Reading Patterns

### Reading with Aggregator (OnlyFins pattern)

OnlyFins uses plain HTTP fetches to the aggregator for all images:

```ts
// fetchFromWalrus utility wraps fetch with retry logic and 25-second timeout
// Aggregator URL from transformSuiObjectsToPosts used as image src for unencrypted posts
```

For encrypted posts: `fetchFromWalrus` retrieves encrypted bytes, then passes to Seal for decryption.

### Reading with TS SDK

```ts
// readBlob with typed error handling
// WalrusFile API: getFiles accepts blob IDs or batch IDs, returns WalrusFile instances
// Batched reads more efficient when files stored together
```

> ⚠️ **Warning**: Walrus SDK reads require ~335 requests to storage nodes. For high-read scenarios, aggregator reads are significantly more efficient.

---

## 4. Querying Owned Blobs

Query blobs owned by a specific wallet address:

```ts
const { data } = useSuiClientQuery('getOwnedObjects', {
  owner: currentAccount.address,
  filter: {
    StructType: `${WALRUS_PACKAGE_ID}::blob::Blob`,
  },
  options: { showContent: true },
});
```

### Blob Attributes (key-value metadata)

Set attributes at upload via `attributes` parameter on `writeBlob`:
- Content type, content length, app-specific metadata
- Stored as dynamic fields on the Sui blob object
- Read with `readBlobAttributes`, update/delete with `executeWriteBlobAttributesTransaction`

---

## 5. Auth / Access Control Hints

### Seal (Encryption + Onchain Access Control)

- All Walrus blobs are **public** by default
- OnlyFins uses **Seal** for access control
- Seal provides threshold encryption tied to Sui object ownership
- In OnlyFins: user receives a `ViewerToken` Sui object after paying for a post
- Seal checks ownership of `ViewerToken` before issuing decryption key shares

**Backend**: `encryptImages.ts` script handles encryption before upload

**Frontend**: `usePostDecryption` hook handles decryption after reading

### Blob Sharing

Walrus supports wrapping blobs in a shared object that anyone can fund/extend:
- Useful for content multiple parties want to keep available
- Currently only via Walrus CLI or manually through Move

### Blob Deletion

- Blob must have `deletable: true` set at registration time
- Permanent blobs cannot be deleted

```ts
// walrus.executeDeleteBlobTransaction — find blob by ID, execute delete transaction
// For browser wallet: useSignAndExecuteTransaction from Sui dApp Kit
```

### Extending Blob Lifetime

Blob storage purchased for a set number of epochs; extend via:

```ts
walrus.extendBlob(blobObjectId, additionalEpochs)
```

---

## 6. Key Files in OnlyFins

| File | Purpose |
|---|---|
| `frontend/src/constants.ts` | Aggregator base URL |
| `frontend/src/utils/post-transform.ts` | `transformSuiObjectsToPosts` — blob ID → URL |
| `frontend/src/utils/walrus-fetch.ts` | `fetchFromWalrus` — HTTP fetch with retry/timeout |
| `frontend/src/components/Feed.tsx` | Fetches posts via `multiGetObjects` |
| `backend/src/config.ts` | Ed25519Keypair signer setup |
| `backend/src/createPosts.ts` | PTB building for post registration |
| `backend/encryptImages.ts` | Pre-upload encryption via Seal |
| `frontend/src/hooks/usePostDecryption.ts` | Post decryption after fetch |

---

## Summary

1. **Upload**: CLI (seeded) or TS SDK `writeBlob`/`writeFiles` with Signer or user wallet
2. **Linking**: `Post` object stores `image_blob_id` (content-addressed); Sui `Object ID` manages lifecycle
3. **Access control**: Seal encrypts blobs; `ViewerToken` Sui object gates decryption; ownership verified onchain
4. **Reading**: Aggregator HTTP fetch (efficient) or TS SDK (flexible, more requests)
5. **Management**: Standard Sui object patterns — query, share, delete, extend lifetime
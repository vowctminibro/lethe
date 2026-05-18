# MemWal SDK Quick Start - Verified

**Fetched:** 2025-05-18

## Package Name
`@mysten-incubation/memwal`

## Install Command
```sh
npm install @mysten-incubation/memwal @mysten/sui @mysten/seal @mysten/walrus
```

For `withMemWal`, you also need:
```sh
npm install ai zod
```

## Quick-Start Code Snippet

```typescript
import { MemWal } from "@mysten-incubation/memwal";

const memwal = MemWal.create({
  key: "<your-ed25519-private-key>",
  accountId: "<your-memwal-account-id>",
  serverUrl: "https://your-relayer-url.com",
  namespace: "demo",
});

await memwal.health();

const job = await memwal.remember("I live in Hanoi and prefer dark mode.");
await memwal.waitForRememberJob(job.job_id);

const result = await memwal.recall("What do we know about this user?");
console.log(result.results);
```

## Configuration Table

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `key` | string | Yes | Ed25519 private key in hex |
| `accountId` | string | Yes | MemWalAccount object ID on Sui |
| `serverUrl` | string | No | Relayer URL |
| `namespace` | string | No | Default namespace ("default") |

## Endpoints

- **Production:** `https://memwal.ai` or `https://memwal.wal.app`
- **Staging:** `https://staging.memwal.ai`
- **Relayer:** `https://relayer.memwal.ai` (mainnet), `https://relayer.staging.memwal.ai` (testnet)
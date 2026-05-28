/**
 * MemWal — Walrus-native memory layer with Vercel AI SDK middleware
 * Package: @mysten-incubation/memwal@0.0.5 (alpha)
 * Reference: research/memwal-sdk.md + audit-v2.md TASK 1
 */

const MEMWAL_RELAYER_URL = process.env.NEXT_PUBLIC_MEMWAL_RELAYER_URL
const MEMWAL_ACCOUNT_ID = process.env.MEMWAL_ACCOUNT_ID

export async function getMemWalAccount() {
  if (!MEMWAL_ACCOUNT_ID) throw new Error('Missing MEMWAL_ACCOUNT_ID — run: pnpm memwal deploy --network testnet')
  throw new Error('TODO: implement getMemWalAccount')
}

export function wrapWithMemWal(provider: any) {
  throw new Error('TODO: implement wrapWithMemWal')
}

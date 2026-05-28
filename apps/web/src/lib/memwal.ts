/**
 * MemWal memory layer via @mysten-incubation/memwal.
 * GitHub:  https://github.com/MystenLabs/MemWal
 * NPM:     https://www.npmjs.com/package/@mysten-incubation/memwal
 * Relayer: https://relayer.memwal.ai
 *
 * MemWal provides persistent memory for AI context across story sessions.
 * It stores a JSON memory blob on Sui + exposes it as LLM context.
 *
 * ⚠ SPOF: relayer.memwal.ai must be online for MemWal reads/writes.
 *   v2 roadmap: self-host the relayer.
 *
 * TODO (Day 3): deploy MemWalAccount contract on Sui testnet
 * TODO (Day 3): configure NEXT_PUBLIC_MEMWAL_RELAYER_URL + MEMWAL_ACCOUNT_ID
 */

export const MEMWAL_CONFIG = {
  relayerUrl: process.env.NEXT_PUBLIC_MEMWAL_RELAYER_URL ?? "https://relayer.memwal.ai",
  accountId: process.env.MEMWAL_ACCOUNT_ID ?? "",
} as const;

/**
 * Create a MemWal account (deploys MemWalAccount Move object on Sui).
 * Call once per user story, store the returned accountId.
 *
 * TODO (Day 3): integrate with @mysten-incubation/memwal deployMemWalAccount()
 */
export async function createMemWalAccount(suiAddress: string): Promise<string> {
  console.info(`[MemWal] would deploy MemWalAccount for ${suiAddress}`);
  // Placeholder — replace with actual MemWal SDK call
  return `memwal_account_${suiAddress.slice(0, 8)}`;
}

/**
 * Wrap a Vercel AI SDK provider with MemWal context injection.
 *
 * TODO (Day 3): use withMemWal(provider) from @mysten-incubation/memwal
 * Ref: https://docs.memwal.ai — "Vercel AI SDK Integration" section
 */
export function withMemWal<T>(provider: T): T {
  console.info("[MemWal] withMemWal wrapper active");
  return provider;
}

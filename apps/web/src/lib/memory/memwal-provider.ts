/**
 * MemWalProvider — stub for the native MemWal data plane.
 *
 * BLOCKED (REAIM.md §3): the published SDK is @mysten/memwal@0.0.2 but both
 * relayers require minSupportedSdk.typescript = 0.0.4 (not on npm). `remember` /
 * `recall` answer HTTP 426 until 0.0.4 ships. The on-chain plane (account create,
 * grant/revoke via delegate keys) already works.
 *
 * TODO when 0.0.4 lands:
 *   - swap the body of remember/recall to `MemWal.create({...}).remember/recall`
 *   - map MemWal grant/revoke to addDelegateKey / removeDelegateKey
 *   - select via NEXT_PUBLIC_MEMORY_PROVIDER=memwal (see ./index.ts)
 * The MemoryProvider contract is identical, so the chat surface + memory view
 * don't change.
 */

import type { MemoryProvider } from "./provider";
import type { MemoryEntry, RememberResult, RecallHit } from "./types";

const BLOCKED =
  "MemWalProvider not available: @mysten/memwal@0.0.4 (relayer minimum) is not yet " +
  "published — using ManualProvider. See REAIM.md §3.";

export class MemWalProvider implements MemoryProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remember(_entry: MemoryEntry): Promise<RememberResult> {
    throw new Error(BLOCKED);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async recall(_query: string): Promise<RecallHit[]> {
    throw new Error(BLOCKED);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async grant(_app: string): Promise<{ digest: string }> {
    throw new Error(BLOCKED);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async revoke(_app: string): Promise<{ digest: string }> {
    throw new Error(BLOCKED);
  }
}

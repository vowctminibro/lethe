/**
 * battle.ts — community head-to-head battle tx builders (foundation).
 *
 * Mirrors the mint pattern: pure tx builders here; execution goes through the
 * Enoki sponsor flow later. See BATTLE_DESIGN.md. Voting is intended to be
 * gasless too — the `vote` target must be added to the Enoki allowlist.
 */

import { Transaction } from "@mysten/sui/transactions";

export const BATTLE_PACKAGE_ID = process.env.NEXT_PUBLIC_BATTLE_PACKAGE_ID ?? "";

export const CREATE_BATTLE_TARGET = BATTLE_PACKAGE_ID
  ? `${BATTLE_PACKAGE_ID}::battle::create_battle`
  : "";
export const VOTE_TARGET = BATTLE_PACKAGE_ID ? `${BATTLE_PACKAGE_ID}::battle::vote` : "";

/** Build a create_battle tx between two Artwork object ids. */
export function buildCreateBattleTx(args: {
  artworkA: string;
  artworkB: string;
  createdAtMs: number;
}): Transaction {
  if (!BATTLE_PACKAGE_ID) throw new Error("Missing NEXT_PUBLIC_BATTLE_PACKAGE_ID");
  const tx = new Transaction();
  tx.moveCall({
    target: CREATE_BATTLE_TARGET,
    arguments: [
      tx.pure.address(args.artworkA),
      tx.pure.address(args.artworkB),
      tx.pure.u64(BigInt(args.createdAtMs)),
    ],
  });
  return tx;
}

/** Build a vote tx for a shared Battle object. side: 0 = A, 1 = B. */
export function buildVoteTx(args: { battleId: string; side: 0 | 1 }): Transaction {
  if (!BATTLE_PACKAGE_ID) throw new Error("Missing NEXT_PUBLIC_BATTLE_PACKAGE_ID");
  const tx = new Transaction();
  tx.moveCall({
    target: VOTE_TARGET,
    arguments: [tx.object(args.battleId), tx.pure.u8(args.side)],
  });
  return tx;
}

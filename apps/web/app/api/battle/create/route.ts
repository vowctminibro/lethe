import { NextRequest, NextResponse } from "next/server";
import { toBase64 } from "@mysten/sui/utils";
import { buildCreateBattleTx, CREATE_BATTLE_TARGET } from "@/src/lib/battle";

export const runtime = "nodejs";

/**
 * STUB (battle foundation): build a create_battle tx and return its tx-kind
 * bytes + move target. Execution (sponsor → sign → execute) and UI come next
 * session. POST { artworkA, artworkB, sender? } -> { target, transactionKindBytes }.
 */
export async function POST(req: NextRequest) {
  try {
    const { artworkA, artworkB, sender } = await req.json();
    if (!artworkA || !artworkB) {
      return NextResponse.json({ error: "missing artworkA/artworkB" }, { status: 400 });
    }
    const tx = buildCreateBattleTx({ artworkA, artworkB, createdAtMs: Date.now() });
    if (sender) tx.setSender(sender);
    const kind = await tx.build({ onlyTransactionKind: true });
    return NextResponse.json({ target: CREATE_BATTLE_TARGET, transactionKindBytes: toBase64(kind) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}

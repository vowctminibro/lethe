import { NextRequest, NextResponse } from "next/server";
import { toBase64 } from "@mysten/sui/utils";
import { buildVoteTx, VOTE_TARGET } from "@/src/lib/battle";
import { getSuiClient } from "@/src/lib/sui";

export const runtime = "nodejs";

/**
 * STUB (battle foundation): build a vote tx for a shared Battle object and
 * return its tx-kind bytes + move target. Execution (sponsor → sign → execute)
 * and UI come next session. The vote target must be added to the Enoki
 * sponsorship allowlist for gasless voting (see HERMES_HANDOFF.md).
 * POST { battleId, side(0|1), sender? } -> { target, transactionKindBytes }.
 */
export async function POST(req: NextRequest) {
  try {
    const { battleId, side, sender } = await req.json();
    if (!battleId || (side !== 0 && side !== 1)) {
      return NextResponse.json({ error: "missing battleId or side must be 0|1" }, { status: 400 });
    }
    const tx = buildVoteTx({ battleId, side });
    if (sender) tx.setSender(sender);
    // shared-object input → resolve its version via the client
    const kind = await tx.build({ client: getSuiClient(), onlyTransactionKind: true });
    return NextResponse.json({ target: VOTE_TARGET, transactionKindBytes: toBase64(kind) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}

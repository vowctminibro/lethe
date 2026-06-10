import { NextRequest, NextResponse } from "next/server";
import { getSuiClient } from "@/src/lib/sui";
import { readActivity } from "@/src/lib/onchain/activity";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST { address } -> { lines: string[] }
 *
 * Thin read-only wallet snapshot for the "link a wallet" chat flavor: balances,
 * object count, sampled tx count, inferred protocols — straight RPC reads, no
 * LLM, no indexer. The client passes `lines` to /api/chat as walletContext.
 */
export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (typeof address !== "string" || !/^0x[0-9a-fA-F]{1,64}$/.test(address)) {
      return NextResponse.json({ error: "missing/invalid address" }, { status: 400 });
    }

    const a = await readActivity(getSuiClient(), address);
    const lines = [
      `Linked wallet: ${address}`,
      a.holdings.length > 0
        ? `Holdings: ${a.holdings.map((h) => `${h.symbol}: ${h.amount}`).join(", ")}`
        : "Holdings: none visible",
      `Owned objects: ${a.ownedObjectCount}`,
      `Recent transactions sampled: ${a.recentTxCount}`,
      a.protocols.length > 0 ? `Protocols touched: ${a.protocols.join(", ")}` : "",
    ].filter(Boolean);

    return NextResponse.json({ lines });
  } catch (e) {
    const message = e instanceof Error ? e.message : "snapshot failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

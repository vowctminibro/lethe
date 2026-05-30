import { NextResponse } from "next/server";
import { listBattleViews } from "@/src/lib/indexer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET -> { battles: BattleView[] } (house + on-chain, with live tallies). */
export async function GET() {
  try {
    const battles = await listBattleViews();
    return NextResponse.json({ battles });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed to load battles", battles: [] },
      { status: 500 },
    );
  }
}

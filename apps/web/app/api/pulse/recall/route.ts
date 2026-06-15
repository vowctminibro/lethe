import { NextRequest, NextResponse } from "next/server";
import { grantGatedRead } from "@/src/lib/memory/grant-read";
import { PULSE_APP_ADDRESS } from "@/src/lib/pulse";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST { ownerAddress } -> { entries, vaultId, authorized }
 *
 * Pulse's read path — now a thin wrapper over the shared grantGatedRead helper
 * (same logic, same response shape). Pulse's app address is the gate; revoked
 * or never-granted → 403, verifiable on Suiscan.
 */
export async function POST(req: NextRequest) {
  try {
    const { ownerAddress } = await req.json();
    if (typeof ownerAddress !== "string" || !/^0x[0-9a-fA-F]+$/.test(ownerAddress)) {
      return NextResponse.json({ error: "missing/invalid ownerAddress" }, { status: 400 });
    }
    const r = await grantGatedRead({ ownerAddress, appAddress: PULSE_APP_ADDRESS, appLabel: "Pulse" });
    if (!r.ok) {
      return NextResponse.json({ error: r.error, vaultId: r.vaultId, entries: [] }, { status: r.status });
    }
    return NextResponse.json({ entries: r.entries, vaultId: r.vaultId, authorized: r.authorized });
  } catch (e) {
    const message = e instanceof Error ? e.message : "pulse recall failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

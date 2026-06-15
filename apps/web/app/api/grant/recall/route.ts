import { NextRequest, NextResponse } from "next/server";
import { grantGatedRead } from "@/src/lib/memory/grant-read";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Generic agent-broker read.
 *
 * POST { ownerAddress, appAddress } -> { entries, vaultId, authorized }
 *
 * The same grant-gated path Pulse runs, but for ANY app/agent address: the
 * server returns the owner's decrypted entries ONLY if `appAddress` is in the
 * vault's on-chain `authorized` vector. Revoked/never-granted → 403 (zero
 * entries) — judge-verifiable on Suiscan. Seal blobs return `sealed: true`
 * (owner-session decrypt only). This is "Continue with Lethe" for agents:
 * warm-start any agent with memory the user owns and can revoke on-chain.
 */
export async function POST(req: NextRequest) {
  try {
    const { ownerAddress, appAddress } = await req.json();
    const addr = /^0x[0-9a-fA-F]+$/;
    if (typeof ownerAddress !== "string" || !addr.test(ownerAddress)) {
      return NextResponse.json({ error: "missing/invalid ownerAddress" }, { status: 400 });
    }
    if (typeof appAddress !== "string" || !addr.test(appAddress)) {
      return NextResponse.json({ error: "missing/invalid appAddress" }, { status: 400 });
    }
    const r = await grantGatedRead({ ownerAddress, appAddress });
    if (!r.ok) {
      return NextResponse.json({ error: r.error, vaultId: r.vaultId, entries: [] }, { status: r.status });
    }
    return NextResponse.json({ entries: r.entries, vaultId: r.vaultId, authorized: r.authorized });
  } catch (e) {
    const message = e instanceof Error ? e.message : "grant recall failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

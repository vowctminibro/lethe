import { NextRequest, NextResponse } from "next/server";
import { EnokiClient } from "@mysten/enoki";
import { MINT_TARGET } from "@/src/lib/sui";
import { VOTE_TARGET, CREATE_BATTLE_TARGET, RESOLVE_BATTLE_TARGET } from "@/src/lib/battle";
import {
  CREATE_TARGET as MEMORY_CREATE_TARGET,
  ADD_ENTRY_TARGET as MEMORY_ADD_ENTRY_TARGET,
  GRANT_TARGET as MEMORY_GRANT_TARGET,
  REVOKE_TARGET as MEMORY_REVOKE_TARGET,
  REMOVE_ENTRY_TARGET as MEMORY_REMOVE_ENTRY_TARGET,
} from "@/src/lib/memory/chain";

export const runtime = "nodejs";

const ENOKI_SECRET_KEY = process.env.ENOKI_SECRET_KEY;
const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet") as
  | "mainnet"
  | "testnet"
  | "devnet";

/**
 * Enoki sponsored-transaction relay (gasless mint).
 *   action "create"  -> { sender, transactionKindBytes } -> { bytes, digest }
 *   action "execute" -> { digest, signature }            -> { digest }
 *
 * Returns 503 until ENOKI_SECRET_KEY is set AND the mint target is on the
 * Enoki sponsorship allowlist.
 */
export async function POST(req: NextRequest) {
  if (!ENOKI_SECRET_KEY) {
    return NextResponse.json(
      {
        error:
          "Enoki not configured: set ENOKI_SECRET_KEY and add the mint target " +
          `(${MINT_TARGET || "<package>::artwork::mint"}) to the Enoki sponsorship allowlist`,
      },
      { status: 503 },
    );
  }

  const enoki = new EnokiClient({ apiKey: ENOKI_SECRET_KEY });

  try {
    const body = await req.json();

    if (body.action === "create") {
      const { sender, transactionKindBytes } = body;
      if (!sender || !transactionKindBytes) {
        return NextResponse.json({ error: "missing sender/transactionKindBytes" }, { status: 400 });
      }
      const allowed = [
        MINT_TARGET,
        VOTE_TARGET,
        CREATE_BATTLE_TARGET,
        RESOLVE_BATTLE_TARGET,
        MEMORY_CREATE_TARGET,
        MEMORY_ADD_ENTRY_TARGET,
        MEMORY_GRANT_TARGET,
        MEMORY_REVOKE_TARGET,
        MEMORY_REMOVE_ENTRY_TARGET,
      ].filter(Boolean);
      const res = await enoki.createSponsoredTransaction({
        network: NETWORK,
        transactionKindBytes,
        sender,
        allowedMoveCallTargets: allowed.length ? allowed : undefined,
      });
      return NextResponse.json({ bytes: res.bytes, digest: res.digest });
    }

    if (body.action === "execute") {
      const { digest, signature } = body;
      if (!digest || !signature) {
        return NextResponse.json({ error: "missing digest/signature" }, { status: 400 });
      }
      const res = await enoki.executeSponsoredTransaction({ digest, signature });
      return NextResponse.json({ digest: res.digest });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "sponsor error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

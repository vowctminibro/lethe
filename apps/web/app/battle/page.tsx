"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { SiteHeader } from "@/src/components/SiteHeader";
import { useBattleActions } from "@/src/lib/vote";
import { getOwnedArtworks, type OwnedArtwork } from "@/src/lib/sui";

interface ArtworkView {
  objectId: string;
  blobId: string;
  label: string;
  owner: string;
  rarityTier: string;
  rarityScore: number;
}
interface BattleView {
  battleId: string;
  creator: string;
  a: ArtworkView;
  b: ArtworkView;
  votesA: number;
  votesB: number;
  status: number; // 0 open, 1 closed
  winnerSide: number; // 0=A,1=B,2=tie,255=open
  winnerArtwork: string;
}

const img = (blobId: string) => `/api/img/${encodeURIComponent(blobId)}`;
const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet";

export default function BattlePage() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { vote, createBattle, resolve, allowlisted } = useBattleActions();

  const [battles, setBattles] = useState<BattleView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/battle/list", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "failed to load");
      setBattles(j.battles);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to load battles");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onVote(b: BattleView, side: 0 | 1) {
    setNotice(null);
    if (!allowlisted) {
      setNotice("⚡ Gasless voting goes live the moment the vote target is allow-listed — tallies above are live on-chain.");
      return;
    }
    if (!account) {
      setNotice("Sign in with Google to vote.");
      return;
    }
    setBusy(b.battleId);
    // optimistic
    setBattles((prev) =>
      prev?.map((x) =>
        x.battleId === b.battleId
          ? { ...x, votesA: x.votesA + (side === 0 ? 1 : 0), votesB: x.votesB + (side === 1 ? 1 : 0) }
          : x,
      ) ?? prev,
    );
    try {
      await vote(b.battleId, side);
      await refresh(); // reconcile with chain
    } catch (e) {
      await refresh(); // roll back optimistic to truth
      const msg = e instanceof Error ? e.message : "vote failed";
      setNotice(/already voted|EAlreadyVoted|code 3/i.test(msg) ? "You've already voted in this battle." : msg);
    } finally {
      setBusy(null);
    }
  }

  async function onResolve(b: BattleView) {
    setNotice(null);
    if (!allowlisted) {
      setNotice("⚡ Closing a battle goes gasless once the resolve target is allow-listed — same one flip as voting.");
      return;
    }
    if (!account) {
      setNotice("Sign in with Google to close your battle.");
      return;
    }
    setBusy(b.battleId);
    try {
      await resolve(b.battleId);
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "close failed";
      setNotice(/ENotCreator|code 4/i.test(msg) ? "Only the battle's creator can close it." : msg);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen" style={{ color: "var(--text)" }}>
      <SiteHeader active="battle" />
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <h1 className="mt-4 text-3xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Battles</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>
          Two collectibles, one community vote. Tallies live on Sui · one vote per address.
          {" "}
          <Link href="/leaderboard" className="underline">See the leaderboard →</Link>
        </p>

        {notice && (
          <div className="mt-4 text-sm p-3 rounded-md border" style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}>
            {notice}
          </div>
        )}
        {error && (
          <div className="mt-4 text-sm p-3 rounded-md border flex items-center justify-between" style={{ borderColor: "var(--accent-h)" }}>
            <span>{error}</span>
            <button onClick={refresh} className="underline">Retry</button>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {battles === null && !error && <div className="text-sm" style={{ color: "var(--text-dim)" }}>Loading battles…</div>}
          {battles?.length === 0 && <div className="text-sm" style={{ color: "var(--text-dim)" }}>No battles yet.</div>}
          {battles?.map((b) => {
            const total = b.votesA + b.votesB;
            const pctA = total ? Math.round((b.votesA / total) * 100) : 50;
            const closed = b.status === 1;
            const isCreator = !!account && account.address === b.creator;
            const winSide = closed ? b.winnerSide : -1; // 0=A 1=B 2=tie
            return (
              <div key={b.battleId} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded"
                    style={{
                      background: closed ? "var(--text)" : "transparent",
                      color: closed ? "var(--accent)" : "var(--text-dim)",
                      border: closed ? "none" : "1px solid var(--border)",
                    }}
                  >
                    {closed ? (winSide === 2 ? "Closed · Tie" : "Closed · Winner 🏆") : "Open"}
                  </span>
                  {!closed && isCreator && (
                    <button
                      onClick={() => onResolve(b)}
                      disabled={busy === b.battleId}
                      className="text-xs h-7 px-3 rounded-md font-semibold disabled:opacity-50"
                      style={{ background: "var(--text)", color: "var(--accent)" }}
                    >
                      {busy === b.battleId ? "…" : allowlisted ? "Close & declare winner" : "Close & declare ⚡"}
                    </button>
                  )}
                  {!closed && !isCreator && (
                    <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>creator closes to crown a winner</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[b.a, b.b].map((art, i) => {
                    const isWinner = closed && winSide === i;
                    const dimmed = closed && winSide !== 2 && !isWinner;
                    return (
                      <div key={art.objectId} className="text-center rounded-lg p-1" style={{ outline: isWinner ? "2px solid var(--accent)" : "none" }}>
                        <div className="aspect-square rounded-lg overflow-hidden border relative" style={{ borderColor: isWinner ? "var(--accent)" : "var(--border)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img(art.blobId)} alt={art.label} className="w-full h-full object-cover" style={{ opacity: dimmed ? 0.5 : 1 }} />
                          {isWinner && (
                            <div className="absolute top-1 left-1 text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ background: "var(--accent)", color: "var(--text)" }}>Winner 🏆</div>
                          )}
                        </div>
                        <div className="mt-2 text-xs font-semibold truncate">{art.label}</div>
                        <div className="text-xs" style={{ color: "var(--text-dim)" }}>{art.rarityTier} · {i === 0 ? b.votesA : b.votesB} votes</div>
                        {!closed && (
                          <button
                            onClick={() => onVote(b, i === 0 ? 0 : 1)}
                            disabled={busy === b.battleId}
                            className="mt-2 w-full h-9 rounded-md text-sm font-semibold disabled:opacity-50"
                            style={{ background: "var(--accent)", color: "var(--text)" }}
                          >
                            {busy === b.battleId ? "…" : allowlisted ? "Vote" : "Vote ⚡"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 h-2 rounded-full overflow-hidden flex" style={{ background: "var(--border)" }}>
                  <div style={{ width: `${pctA}%`, background: "var(--text)" }} />
                  <div style={{ width: `${100 - pctA}%`, background: "var(--accent-h)" }} />
                </div>
                <div className="mt-1 flex justify-between text-[11px]" style={{ color: "var(--text-dim)" }}>
                  <span>{b.votesA}</span>
                  <a href={`https://suiscan.xyz/${NETWORK}/object/${b.battleId}`} target="_blank" rel="noreferrer" className="underline">on-chain ↗</a>
                  <span>{b.votesB}</span>
                </div>
              </div>
            );
          })}
        </div>

        <CreateBattle account={account} client={client} allowlisted={allowlisted} createBattle={createBattle} onCreated={refresh} setNotice={setNotice} />
      </div>
    </main>
  );
}

function CreateBattle({
  account,
  client,
  allowlisted,
  createBattle,
  onCreated,
  setNotice,
}: {
  account: { address: string } | null;
  client: ReturnType<typeof useSuiClient>;
  allowlisted: boolean;
  createBattle: (a: string, b: string) => Promise<{ digest: string }>;
  onCreated: () => void;
  setNotice: (s: string | null) => void;
}) {
  const [owned, setOwned] = useState<OwnedArtwork[]>([]);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!account) return;
    getOwnedArtworks(client, account.address).then(setOwned).catch(() => {});
  }, [account, client]);

  if (!account) {
    return (
      <div className="mt-10 text-sm" style={{ color: "var(--text-dim)" }}>
        Sign in to start a battle with your own collectibles.
      </div>
    );
  }

  async function create() {
    if (!a || !b || a === b) {
      setNotice("Pick two different collectibles.");
      return;
    }
    if (!allowlisted) {
      setNotice("⚡ Creating battles goes gasless-live with voting (one allow-list step away).");
      return;
    }
    setBusy(true);
    try {
      await createBattle(a, b);
      onCreated();
      setNotice("Battle created!");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-12 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
      <div className="text-sm font-semibold">Start a battle</div>
      <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>Pit two collectibles head-to-head.</p>
      {owned.length < 2 ? (
        <p className="text-xs mt-3" style={{ color: "var(--text-dim)" }}>
          You need 2 owned collectibles. <Link href="/create" className="underline">Create more →</Link>
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {[{ v: a, set: setA }, { v: b, set: setB }].map((sel, idx) => (
            <select
              key={idx}
              value={sel.v}
              onChange={(e) => sel.set(e.target.value)}
              className="h-9 px-2 rounded-md text-sm border"
              style={{ borderColor: "var(--border)", background: "var(--bg-panel)", color: "var(--text)" }}
            >
              <option value="">{idx === 0 ? "Side A…" : "Side B…"}</option>
              {owned.map((o) => (
                <option key={o.objectId} value={o.objectId}>{o.objectId.slice(0, 8)}…</option>
              ))}
            </select>
          ))}
          <button onClick={create} disabled={busy} className="h-9 px-4 rounded-md text-sm font-semibold disabled:opacity-50" style={{ background: "var(--text)", color: "var(--accent)" }}>
            {busy ? "Creating…" : allowlisted ? "Create battle" : "Create ⚡"}
          </button>
        </div>
      )}
    </div>
  );
}

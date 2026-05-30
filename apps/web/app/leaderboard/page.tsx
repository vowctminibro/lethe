import Link from "next/link";
import { SiteHeader } from "@/src/components/SiteHeader";
import { leaderboard } from "@/src/lib/indexer";

export const dynamic = "force-dynamic";

const img = (blobId: string) => `/api/img/${encodeURIComponent(blobId)}`;
const short = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—");
const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet";

export default async function LeaderboardPage() {
  let rows: Awaited<ReturnType<typeof leaderboard>> = [];
  let error: string | null = null;
  try {
    rows = await leaderboard();
  } catch (e) {
    error = e instanceof Error ? e.message : "failed to load leaderboard";
  }

  return (
    <main className="min-h-screen" style={{ color: "var(--text)" }}>
      <SiteHeader active="leaderboard" />
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <h1 className="mt-4 text-3xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Leaderboard</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>
          Ranked by wins from <strong>resolved</strong> battles (rarity breaks ties).
          Open battles don&apos;t count until closed. Live from on-chain battles.
          {" "}
          <Link href="/battle" className="underline">Go vote →</Link>
        </p>

        {error && (
          <div className="mt-6 text-sm p-3 rounded-md border" style={{ borderColor: "var(--accent-h)" }}>{error}</div>
        )}
        {!error && rows.length === 0 && (
          <div className="mt-6 text-sm" style={{ color: "var(--text-dim)" }}>No battles yet — be the first.</div>
        )}

        <div className="mt-6 space-y-2">
          {rows.map((r) => (
            <div
              key={r.artwork.objectId}
              className="flex items-center gap-4 p-3 rounded-xl border"
              style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}
            >
              <div className="w-8 text-center text-lg font-bold" style={{ color: "var(--text-dim)" }}>{r.rank}</div>
              <div className="w-14 h-14 rounded-lg overflow-hidden border shrink-0" style={{ borderColor: "var(--border)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(r.artwork.blobId)} alt={r.artwork.label} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{r.artwork.label}</div>
                <div className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {r.artwork.rarityTier} · owner{" "}
                  <a href={`https://suiscan.xyz/${NETWORK}/account/${r.artwork.owner}`} target="_blank" rel="noreferrer" className="underline">{short(r.artwork.owner)}</a>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{r.wins} {r.wins === 1 ? "win" : "wins"}</div>
                <div className="text-xs" style={{ color: "var(--text-dim)" }}>{r.votes} votes</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

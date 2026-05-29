"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { getOwnedArtworks, type OwnedArtwork } from "@/src/lib/sui";
import { parseTraits, computeRarity, selectionLabels } from "@/src/lib/traits";

const AGG = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL;
// Render through our proxy (sets a correct image MIME); keep the raw aggregator
// url for an explicit "verify on Walrus" link.
const blobUrl = (id: string) => `/api/img/${encodeURIComponent(id)}`;
const aggregatorUrl = (id: string) => `${AGG}/v1/blobs/${id}`;

function rarityLabel(traits: string): string {
  try {
    const r = computeRarity(parseTraits(traits));
    return `${r.tier} · 1 in ${r.score}`;
  } catch {
    return "";
  }
}

export default function MePage() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const [items, setItems] = useState<OwnedArtwork[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!account) {
      setItems(null);
      return;
    }
    let cancelled = false;
    setItems(null);
    setError(null);
    getOwnedArtworks(client, account.address)
      .then((list) => !cancelled && setItems(list))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Couldn't load your collection."));
    return () => {
      cancelled = true;
    };
  }, [account, client, nonce]);

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-6 py-8" style={{ color: "var(--text)" }}>
      <header className="flex items-center justify-between">
        <Link href="/" className="font-display text-xl" style={{ fontFamily: "var(--font-display)" }}>lethe</Link>
        <Link href="/create" className="text-sm underline" style={{ color: "var(--text-dim)" }}>+ create</Link>
      </header>

      <h1 className="mt-8 text-3xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>My collection</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>
        Owned Artwork NFTs, with images fetched live from Walrus.
      </p>

      <div className="mt-8">
        {!account && (
          <div className="rounded-lg border border-dashed p-12 text-center" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
            Sign in on the <Link href="/create" className="underline">create page</Link> to see your collection.
          </div>
        )}

        {account && items === null && !error && (
          <div className="text-sm" style={{ color: "var(--text-dim)" }}>Loading…</div>
        )}

        {error && (
          <div className="text-sm p-4 rounded-md border flex items-center justify-between gap-4" style={{ borderColor: "var(--accent-h)" }}>
            <span>{error}</span>
            <button onClick={() => setNonce((n) => n + 1)} className="underline shrink-0">Retry</button>
          </div>
        )}

        {account && items && items.length === 0 && (
          <div className="rounded-lg border border-dashed p-12 text-center" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
            No collectibles yet. <Link href="/create" className="underline">Create your first →</Link>
          </div>
        )}

        {account && items && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {items.map((a) => (
              <div key={a.objectId} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}>
                <div className="aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={blobUrl(a.blobId)} alt="collectible" className="w-full h-full object-cover" />
                </div>
                <div className="p-3 text-xs" style={{ color: "var(--text-dim)" }}>
                  <div className="font-semibold" style={{ color: "var(--text)" }}>{selectionLabels(parseTraits(a.traits)).join(" · ")}</div>
                  <div className="mt-1">{rarityLabel(a.traits)}</div>
                  <a href={aggregatorUrl(a.blobId)} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all opacity-70 underline">
                    blob {a.blobId.slice(0, 10)}… ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

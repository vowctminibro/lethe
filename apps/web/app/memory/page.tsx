"use client";

/**
 * Your Memory — the verifiable view (hero flow 1:05–1:30).
 *
 * Lists every entry in the user's owned Memory object: the decrypted fact, its
 * Walrus blob id, the Sui object id, and one-tap explorer links so a judge can
 * confirm the blob + object exist on-chain. The blob link opens the raw
 * (encrypted) ciphertext on the Walrus aggregator — proof it's stored and
 * unreadable without the key.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSuiClient } from "@mysten/dapp-kit";
import { Logo } from "@/src/components/Logo";
import { SignIn } from "@/src/components/SiteHeader";
import { useMemory, getOwnedMemory, type OwnedMemory, type RecallHit } from "@/src/lib/memory";
import { DEMO_MOCK, getMockOwnedMemory, useLetheAccount } from "@/src/lib/demo/mock";
import { PULSE_APP_ADDRESS } from "@/src/lib/pulse";

const AGG = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL;
const blobUrl = (id: string) => `${AGG}/v1/blobs/${id}`;
const objUrl = (id: string) => `https://suiscan.xyz/testnet/object/${id}`;
const short = (s: string) => (s.length > 16 ? `${s.slice(0, 10)}…${s.slice(-6)}` : s);

export default function MemoryPage() {
  const account = useLetheAccount();
  const client = useSuiClient();
  const memory = useMemory();
  const [chain, setChain] = useState<OwnedMemory | null>(null);
  const [hits, setHits] = useState<RecallHit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [appAddr, setAppAddr] = useState("");
  const [accessBusy, setAccessBusy] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!account || !memory) return;
    setError(null);
    setHits(null);
    try {
      const owned = DEMO_MOCK ? getMockOwnedMemory() : await getOwnedMemory(client, account.address);
      setChain(owned);
      // recall("") decrypts all entries, newest first.
      const all = owned && owned.entries.length > 0 ? await memory.recall("") : [];
      setHits(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your memory.");
    }
  }, [account, client, memory, nonce]);

  useEffect(() => {
    void load();
  }, [load]);

  async function grant() {
    const app = appAddr.trim();
    if (!memory || !app) return;
    setAccessError(null);
    setAccessBusy("grant");
    try {
      await memory.grant(app);
      setAppAddr("");
      setNonce((n) => n + 1); // reload authorized list from chain
    } catch (e) {
      setAccessError(e instanceof Error ? e.message : "grant failed");
    } finally {
      setAccessBusy(null);
    }
  }

  async function revoke(app: string) {
    if (!memory) return;
    setAccessError(null);
    setAccessBusy(app);
    try {
      await memory.revoke(app);
      setNonce((n) => n + 1);
    } catch (e) {
      setAccessError(e instanceof Error ? e.message : "revoke failed");
    } finally {
      setAccessBusy(null);
    }
  }

  const validApp = /^0x[0-9a-fA-F]{1,64}$/.test(appAddr.trim());

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-3xl mx-auto w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <Link href="/chat" className="text-sm underline" style={{ color: "var(--text-dim)" }}>
              ← Chat
            </Link>
          </div>
          <SignIn />
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-6 py-8">
        <h1 className="text-3xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Your Memory</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>
          Every entry is encrypted on Walrus and referenced on a Sui object you own. Tap any link to verify on-chain.
        </p>

        {chain && (
          <div className="mt-4 text-xs" style={{ color: "var(--text-dim)" }}>
            Memory object:{" "}
            <a href={objUrl(chain.objectId)} target="_blank" rel="noreferrer" className="underline break-all">
              {short(chain.objectId)} ↗
            </a>
            <span className="mx-2">·</span>
            {chain.entries.length} {chain.entries.length === 1 ? "entry" : "entries"}
            <span className="mx-2">·</span>
            {chain.authorized.length} app{chain.authorized.length === 1 ? "" : "s"} authorized
          </div>
        )}

        {account && (
          <section className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}>
            <h2 className="text-sm font-semibold">App access</h2>
            <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
              Grant an app address read access to your memory, or revoke it. Revoke = forget: a revoked app
              can no longer recall anything you stored. Each change is a gasless, owner-only transaction on your Memory object.
            </p>

            {/* Pulse — the known second surface, one-tap toggle */}
            <div className="mt-3 rounded-lg border p-3 flex items-center justify-between gap-3" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
              <div className="min-w-0">
                <div className="text-sm font-semibold flex items-center gap-2">
                  ◍ Pulse
                  <Link href="/pulse" className="text-[11px] font-normal underline" style={{ color: "var(--text-dim)" }}>
                    open ↗
                  </Link>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-dim)" }}>
                  Portfolio companion — reads this vault when granted. App address {PULSE_APP_ADDRESS.slice(0, 10)}…{PULSE_APP_ADDRESS.slice(-6)}
                </p>
              </div>
              {chain?.authorized.includes(PULSE_APP_ADDRESS) ? (
                <button
                  onClick={() => revoke(PULSE_APP_ADDRESS)}
                  disabled={accessBusy !== null}
                  className="text-xs px-3 py-1.5 rounded-md border disabled:opacity-50 shrink-0"
                  style={{ borderColor: "var(--accent-h)", color: "var(--accent-h)" }}
                >
                  {accessBusy === PULSE_APP_ADDRESS ? "Revoking…" : "Revoke = forget"}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (!memory || accessBusy) return;
                    setAccessError(null);
                    setAccessBusy("grant-pulse");
                    try {
                      await memory.grant(PULSE_APP_ADDRESS);
                      setNonce((n) => n + 1);
                    } catch (e) {
                      setAccessError(e instanceof Error ? e.message : "grant failed");
                    } finally {
                      setAccessBusy(null);
                    }
                  }}
                  disabled={accessBusy !== null}
                  className="text-xs px-3 py-1.5 rounded-md font-semibold disabled:opacity-50 shrink-0"
                  style={{ background: "var(--text)", color: "var(--accent)" }}
                >
                  {accessBusy === "grant-pulse" ? "Granting…" : "Grant access"}
                </button>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={appAddr}
                onChange={(e) => setAppAddr(e.target.value)}
                placeholder="0x… app address to grant"
                className="flex-1 h-10 px-3 rounded-md text-sm outline-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
              <button
                onClick={grant}
                disabled={!validApp || accessBusy !== null}
                className="h-10 px-4 rounded-md text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--text)", color: "var(--accent)" }}
              >
                {accessBusy === "grant" ? "Granting…" : "Grant"}
              </button>
            </div>

            {accessError && (
              <p className="mt-2 text-xs" style={{ color: "var(--accent-h)" }}>{accessError}</p>
            )}

            <div className="mt-4">
              <div className="text-xs uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
                Authorized apps
              </div>
              {chain && chain.authorized.filter((a) => a !== PULSE_APP_ADDRESS).length > 0 ? (
                <ul className="mt-2 flex flex-col gap-2">
                  {chain.authorized.filter((a) => a !== PULSE_APP_ADDRESS).map((app) => (
                    <li key={app} className="flex items-center justify-between gap-3 text-sm">
                      <a href={objUrl(app)} target="_blank" rel="noreferrer" className="underline break-all" style={{ color: "var(--text-dim)" }}>
                        {short(app)} ↗
                      </a>
                      <button
                        onClick={() => revoke(app)}
                        disabled={accessBusy !== null}
                        className="text-xs px-3 py-1 rounded-md border disabled:opacity-50 shrink-0"
                        style={{ borderColor: "var(--accent-h)", color: "var(--accent-h)" }}
                      >
                        {accessBusy === app ? "Revoking…" : "Revoke = forget"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs" style={{ color: "var(--text-dim)" }}>
                  No other apps authorized — only you{chain?.authorized.includes(PULSE_APP_ADDRESS) ? " and Pulse" : ""} can read this memory.
                </p>
              )}
            </div>

            <p className="mt-4 text-[11px]" style={{ color: "var(--text-dim)" }}>
              Encrypted at rest on Walrus · access enforced by your on-chain grants · Seal threshold encryption on the roadmap.
            </p>
          </section>
        )}

        <div className="mt-6">
          {!account && (
            <div className="rounded-lg border border-dashed p-12 text-center" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
              Sign in to view your owned memory.
            </div>
          )}

          {account && error && (
            <div className="text-sm p-4 rounded-md border flex items-center justify-between gap-4" style={{ borderColor: "var(--accent-h)" }}>
              <span>{error}</span>
              <button onClick={() => setNonce((n) => n + 1)} className="underline shrink-0">Retry</button>
            </div>
          )}

          {account && !error && hits === null && (
            <div className="text-sm" style={{ color: "var(--text-dim)" }}>Loading from Walrus…</div>
          )}

          {account && !error && hits && hits.length === 0 && (
            <div className="rounded-lg border border-dashed p-12 text-center" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
              No memories yet. <Link href="/chat" className="underline">Tell Lethe about yourself →</Link>
            </div>
          )}

          {account && hits && hits.length > 0 && (
            <ul className="flex flex-col gap-3">
              {hits.map((h) => (
                <li key={h.blobId} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm" style={{ color: "var(--text)" }}>{h.text}</p>
                    <span className="text-[10px] uppercase tracking-wide shrink-0 px-2 py-0.5 rounded" style={{ background: "var(--bg)", color: "var(--text-dim)" }}>
                      {h.kind}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: "var(--text-dim)" }}>
                    <a className="underline break-all" href={blobUrl(h.blobId)} target="_blank" rel="noreferrer" title="Raw encrypted blob on Walrus">
                      Walrus blob {short(h.blobId)} ↗
                    </a>
                    {chain && (
                      <a className="underline break-all" href={objUrl(chain.objectId)} target="_blank" rel="noreferrer" title="Referenced on your Memory vault object">
                        Suiscan object {short(chain.objectId)} ↗
                      </a>
                    )}
                    {h.createdAtMs > 0 && (
                      <span title={new Date(h.createdAtMs).toISOString()}>
                        {new Date(h.createdAtMs).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

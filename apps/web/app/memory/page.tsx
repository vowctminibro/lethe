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
  const [forgetTarget, setForgetTarget] = useState<RecallHit | null>(null);
  const [forgetBusy, setForgetBusy] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; href?: string } | null>(null);

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

  // Export = exit: every entry, already decrypted CLIENT-SIDE by the owner's
  // Seal session (the server can't read Seal blobs), downloaded as a file the
  // user keeps. Ownership means you can leave with your data any day.
  function exportMemory() {
    if (!account || !chain || !hits || hits.length === 0) return;
    const agg = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ?? "";
    const payload = {
      note: "Exported from Lethe — your memory, your file.",
      exportedAt: new Date().toISOString(),
      owner: account.address,
      vaultId: chain.objectId,
      vaultUrl: `https://suiscan.xyz/testnet/object/${chain.objectId}`,
      entries: hits.map((h) => ({
        text: h.text,
        kind: h.kind,
        createdAtMs: h.createdAtMs,
        blobId: h.blobId,
        walrusUrl: `${agg}/v1/blobs/${encodeURIComponent(h.blobId)}`,
        suiscanObjectUrl: `https://suiscan.xyz/testnet/object/${chain.objectId}`,
      })),
    };
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const name = `lethe-memory-${account.address.slice(2, 8)}-${date}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ text: `Exported ${hits.length} ${hits.length === 1 ? "memory" : "memories"} → ${name}` });
    setTimeout(() => setToast(null), 6000);
  }

  // Forget one entry: confirm → optimistic row-out → gasless remove_entry →
  // toast with the Suiscan tx. On failure the row comes back.
  async function confirmForget() {
    const hit = forgetTarget;
    if (!memory || !hit || forgetBusy) return;
    setForgetBusy(true);
    setLeaving(hit.blobId);
    try {
      const { digest } = await memory.forget(hit.blobId);
      setForgetTarget(null);
      // Let the row-out transition play before the list collapses.
      setTimeout(() => {
        setHits((h) => (h ? h.filter((x) => x.blobId !== hit.blobId) : h));
        setChain((c) =>
          c ? { ...c, entries: c.entries.filter((e) => e.blobId !== hit.blobId) } : c,
        );
        setLeaving(null);
      }, 480);
      setToast({
        text: "Forgotten — the on-chain reference is gone.",
        href: `https://suiscan.xyz/testnet/tx/${digest}`,
      });
      setTimeout(() => setToast(null), 8000);
    } catch (e) {
      setLeaving(null);
      setForgetTarget(null);
      setToast({ text: e instanceof Error ? `Forget failed: ${e.message}` : "Forget failed" });
      setTimeout(() => setToast(null), 8000);
    } finally {
      setForgetBusy(false);
    }
  }

  // Grant/revoke Pulse straight from the hub map node.
  async function togglePulse() {
    if (!memory || accessBusy) return;
    const granted = chain?.authorized.includes(PULSE_APP_ADDRESS);
    setAccessError(null);
    setAccessBusy(granted ? PULSE_APP_ADDRESS : "grant-pulse");
    try {
      if (granted) await memory.revoke(PULSE_APP_ADDRESS);
      else await memory.grant(PULSE_APP_ADDRESS);
      setNonce((n) => n + 1);
    } catch (e) {
      setAccessError(e instanceof Error ? e.message : granted ? "revoke failed" : "grant failed");
    } finally {
      setAccessBusy(null);
    }
  }

  const validApp = /^0x[0-9a-fA-F]{1,64}$/.test(appAddr.trim());

  const pulseGranted = chain?.authorized.includes(PULSE_APP_ADDRESS) ?? false;
  const pulseBusy = accessBusy === PULSE_APP_ADDRESS || accessBusy === "grant-pulse";

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
        <h1 className="lethe-head">Your Memory</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>
          Every entry is encrypted on Walrus and referenced on a Sui object you own. Tap any link to verify on-chain.
        </p>

        {/* ── MEMORY HUB — the vault and its readers, as a living map ── */}
        {account && chain && (
          <section className="mt-6 lethe-hairline rounded overflow-hidden lethe-water" style={{ background: "var(--bg-panel)" }}>
            <svg viewBox="0 0 680 300" className="w-full h-auto relative" aria-label="Your memory hub: the vault and the agents that read it">
              {/* spokes */}
              <line x1="340" y1="135" x2="150" y2="135" stroke="#5A8A9E" strokeWidth="1" opacity="0.55" />
              <line
                x1="340" y1="135" x2="530" y2="135"
                stroke={pulseGranted ? "#5A8A9E" : "#5A8A9E"}
                strokeWidth="1"
                strokeDasharray={pulseGranted ? "0" : "4 6"}
                opacity={pulseGranted ? 0.55 : 0.22}
                style={{ transition: "opacity 0.45s ease, stroke-dasharray 0.45s ease" }}
              />
              <line x1="340" y1="135" x2="340" y2="226" stroke="#5A8A9E" strokeWidth="1" strokeDasharray="3 6" opacity="0.3" />

              {/* memory motes on live spokes — coral */}
              <circle cx="245" cy="135" r="2.5" fill="#E8B894" />
              <circle cx="295" cy="135" r="2" fill="#E8B894" />
              {pulseGranted && <circle cx="435" cy="135" r="2.5" fill="#E8B894" style={{ transition: "opacity 0.4s" }} />}

              {/* vault disc — ink, italic L, entry count */}
              <circle cx="340" cy="135" r="44" fill="#1A3A4A" />
              <text x="336" y="150" fontFamily="var(--font-display)" fontStyle="italic" fontSize="42" fill="#EFF5F4" textAnchor="middle">L</text>
              <circle cx="367" cy="149" r="3.2" fill="#E8B894" />
              <text x="340" y="200" className="lethe-id" fill="#5A8A9E" fontSize="10.5" textAnchor="middle" letterSpacing="0.08em">
                {chain.entries.length} {chain.entries.length === 1 ? "ENTRY" : "ENTRIES"} — YOURS
              </text>

              {/* Lethe node — this surface, always connected */}
              <g>
                <circle cx="150" cy="135" r="30" fill="var(--bg)" stroke="#1A3A4A" strokeWidth="1" />
                <text x="150" y="132" className="lethe-id" fill="#1A3A4A" fontSize="10.5" textAnchor="middle" letterSpacing="0.08em">LETHE</text>
                <text x="150" y="146" fill="#5A8A9E" fontSize="9" textAnchor="middle">this app</text>
              </g>

              {/* Pulse node — grant toggle ON the map */}
              <g
                role="button"
                aria-label={pulseGranted ? "Revoke Pulse's access" : "Grant Pulse access"}
                onClick={togglePulse}
                style={{ cursor: pulseBusy ? "wait" : "pointer", opacity: pulseGranted ? 1 : 0.55, transition: "opacity 0.45s ease" }}
                data-testid="pulse-node"
              >
                <circle cx="530" cy="135" r="30" fill="var(--bg)" stroke="#1A3A4A" strokeWidth="1" strokeDasharray={pulseGranted ? "0" : "3 5"} />
                <text x="530" y="130" className="lethe-id" fill="#1A3A4A" fontSize="10.5" textAnchor="middle" letterSpacing="0.08em">PULSE</text>
                <text x="530" y="144" fill={pulseGranted ? "#C4946E" : "#5A8A9E"} fontSize="9" textAnchor="middle">
                  {pulseBusy ? "…" : pulseGranted ? "revoke ✂" : "grant +"}
                </text>
              </g>

              {/* open slot — the thesis in one dashed circle */}
              <g opacity="0.65">
                <circle cx="340" cy="242" r="16" fill="none" stroke="#5A8A9E" strokeWidth="1" strokeDasharray="3 5" />
                <text x="340" y="246" fill="#5A8A9E" fontSize="11" textAnchor="middle">+</text>
              </g>
              <text x="340" y="276" className="lethe-id" fill="#5A8A9E" fontSize="9.5" textAnchor="middle" letterSpacing="0.08em">
                ANY AGENT — SAME MEMORY.
              </text>
              <text x="340" y="290" className="lethe-id" fill="#5A8A9E" fontSize="9.5" textAnchor="middle" letterSpacing="0.08em">
                CONNECT BELOW.
              </text>
            </svg>

            <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <a href={objUrl(chain.objectId)} target="_blank" rel="noreferrer" className="lethe-id underline decoration-dotted underline-offset-2 hover:opacity-70" style={{ color: "var(--accent-h)" }}>
                vault {short(chain.objectId)} ↗
              </a>
              <Link href="/pulse" className="text-[11px] underline" style={{ color: "var(--text-dim)" }}>
                open Pulse ↗
              </Link>
            </div>
          </section>
        )}

        {/* ── App access — the open slot, made concrete ── */}
        {account && (
          <section className="mt-5 lethe-hairline rounded p-4" style={{ background: "var(--bg-panel)" }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Connect an agent</h2>
            <p className="mt-1 text-xs" style={{ color: "var(--text-dim)" }}>
              Grant any app address read access, or revoke it. Revoke = forget: a revoked app can no longer
              recall anything you stored. Each change is a gasless, owner-only transaction on your vault.
            </p>

            <div className="mt-3 flex gap-2">
              <input
                value={appAddr}
                onChange={(e) => setAppAddr(e.target.value)}
                placeholder="0x… app address to grant"
                className="lethe-id flex-1 h-10 px-3 rounded outline-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
              <button
                onClick={grant}
                disabled={!validApp || accessBusy !== null}
                className="h-10 px-4 rounded text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--text)", color: "var(--bg)" }}
              >
                {accessBusy === "grant" ? "Granting…" : "Grant"}
              </button>
            </div>

            {accessError && (
              <p className="mt-2 text-xs" style={{ color: "#C0564A" }}>{accessError}</p>
            )}

            {chain && chain.authorized.filter((a) => a !== PULSE_APP_ADDRESS).length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {chain.authorized.filter((a) => a !== PULSE_APP_ADDRESS).map((app) => (
                  <li key={app} className="flex items-center justify-between gap-3 text-sm">
                    <a href={objUrl(app)} target="_blank" rel="noreferrer" className="lethe-id underline break-all" style={{ color: "var(--text-dim)" }}>
                      {short(app)} ↗
                    </a>
                    <button
                      onClick={() => revoke(app)}
                      disabled={accessBusy !== null}
                      className="text-xs px-3 py-1 rounded border disabled:opacity-50 shrink-0"
                      style={{ borderColor: "var(--accent-h)", color: "var(--accent-h)" }}
                    >
                      {accessBusy === app ? "Revoking…" : "Revoke = forget"}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-[11px]" style={{ color: "var(--text-dim)" }}>
              End-to-end encrypted with Seal threshold encryption — even Lethe's servers can't read your memories. Decryption requires on-chain policy approval; revoke a grant and it stops, live.
            </p>
          </section>
        )}

        {/* ── The ledger ── */}
        <div className="mt-6">
          {!account && (
            <div className="rounded border border-dashed p-12 text-center" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
              Sign in to view your owned memory.
            </div>
          )}

          {account && error && (
            <div className="text-sm p-4 rounded border flex items-center justify-between gap-4" style={{ borderColor: "var(--accent-h)" }}>
              <span>{error}</span>
              <button onClick={() => setNonce((n) => n + 1)} className="underline shrink-0">Retry</button>
            </div>
          )}

          {account && !error && hits === null && (
            <div className="text-sm" style={{ color: "var(--text-dim)" }}>Loading from Walrus…</div>
          )}

          {account && !error && hits && hits.length === 0 && (
            <div className="rounded border border-dashed p-12 text-center" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
              No memories yet. <Link href="/chat" className="underline">Tell Lethe about yourself →</Link>
            </div>
          )}

          {account && hits && hits.length > 0 && (
            <section className="lethe-hairline rounded overflow-hidden" style={{ background: "var(--bg-panel)" }}>
              <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="lethe-id uppercase" style={{ color: "var(--text-dim)" }}>Ledger — {hits.length} {hits.length === 1 ? "entry" : "entries"}</span>
                <span className="flex items-center gap-3">
                  <button
                    onClick={exportMemory}
                    data-testid="export-memory"
                    className="lethe-id uppercase underline decoration-dotted underline-offset-2 hover:opacity-70 transition"
                    style={{ color: "var(--accent-h)" }}
                    title="Decrypts in your browser and downloads a JSON file — your memory, your file"
                  >
                    Export memory ↓
                  </button>
                  <span className="lethe-id" style={{ color: "var(--text-dim)" }}>NEWEST FIRST</span>
                </span>
              </div>
              <ul>
                {hits.map((h) => (
                  <li
                    key={h.blobId}
                    data-testid="memory-entry"
                    className={leaving === h.blobId ? "lethe-inkwash" : undefined}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <div className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{h.text}</p>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="lethe-id uppercase px-1.5 py-0.5 rounded lethe-hairline" style={{ color: "var(--text-dim)" }}>
                            {h.kind}
                          </span>
                          <button
                            data-testid="forget-button"
                            onClick={() => setForgetTarget(h)}
                            disabled={forgetBusy}
                            className="text-[11px] px-2 py-0.5 rounded border disabled:opacity-50"
                            style={{ borderColor: "var(--accent-h)", color: "var(--accent-h)" }}
                            title="Remove this entry from your vault"
                          >
                            Forget
                          </button>
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 items-center lethe-id" style={{ color: "var(--text-dim)" }}>
                        <a className="underline decoration-dotted underline-offset-2 break-all hover:opacity-70" style={{ color: "var(--accent-h)" }} href={blobUrl(h.blobId)} target="_blank" rel="noreferrer" title="Raw encrypted blob on Walrus">
                          walrus {short(h.blobId)} ↗
                        </a>
                        {chain && (
                          <a className="underline decoration-dotted underline-offset-2 break-all hover:opacity-70" style={{ color: "var(--accent-h)" }} href={objUrl(chain.objectId)} target="_blank" rel="noreferrer" title="Referenced on your Memory vault object">
                            suiscan {short(chain.objectId)} ↗
                          </a>
                        )}
                        {h.createdAtMs > 0 && (
                          <span title={new Date(h.createdAtMs).toISOString()}>
                            {new Date(h.createdAtMs).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* ── Forget confirm dialog ── */}
      {forgetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 lethe-overlay-in" style={{ background: "rgba(10, 22, 40, 0.45)" }} onClick={() => !forgetBusy && setForgetTarget(null)}>
          <div
            data-testid="forget-dialog"
            className="w-full max-w-md rounded border p-5"
            style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>Forget this memory?</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text)", fontStyle: "italic", fontFamily: "var(--font-display)" }}>&ldquo;{forgetTarget.text}&rdquo;</p>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-dim)" }}>
              Removes the on-chain reference from your vault. The encrypted blob on Walrus becomes
              orphaned ciphertext — unreadable and no longer part of your memory. Gasless, owner-only.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setForgetTarget(null)}
                disabled={forgetBusy}
                className="h-9 px-4 rounded text-sm border disabled:opacity-50"
                style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
              >
                Keep it
              </button>
              <button
                data-testid="forget-confirm"
                onClick={confirmForget}
                disabled={forgetBusy}
                className="h-9 px-4 rounded text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--accent-h)", color: "var(--bg-panel)" }}
              >
                {forgetBusy ? "Forgetting…" : "Forget"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded border px-4 py-2.5 text-sm flex items-center gap-3" style={{ borderColor: "var(--border)", background: "var(--bg-panel)", color: "var(--text)", boxShadow: "var(--shadow-ambient)" }}>
          <span>{toast.text}</span>
          {toast.href && (
            <a href={toast.href} target="_blank" rel="noreferrer" className="lethe-id underline shrink-0" style={{ color: "var(--accent-h)" }}>
              suiscan tx ↗
            </a>
          )}
        </div>
      )}
    </main>
  );
}

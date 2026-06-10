"use client";

/**
 * Pulse — a SECOND Lethe-powered surface (hero 0:40–1:05, the money shot).
 *
 * Visually its own product: midnight palette, dashboard layout, different
 * wordmark. On load it reads the SAME owned Memory vault through
 * /api/pulse/recall, which decrypts ONLY if Pulse's app address is in the
 * vault's on-chain `authorized` vector. Granted → it greets the user with
 * everything it already knows (never having been told) + a streamed briefing.
 * Revoked → the API refuses and Pulse knows nothing. Portability + revocation,
 * live and judge-verifiable.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useMemory } from "@/src/lib/memory";
import { DEMO_MOCK, getMockOwnedMemory, useLetheAccount } from "@/src/lib/demo/mock";
import { PULSE_APP_ADDRESS, PULSE_TAGLINE } from "@/src/lib/pulse";

interface PulseEntry {
  text: string;
  kind: string;
  blobId: string;
  createdAtMs: number;
}

type State =
  | { phase: "signed-out" }
  | { phase: "loading" }
  | { phase: "denied"; vaultId: string | null }
  | { phase: "no-vault" }
  | { phase: "granted"; entries: PulseEntry[]; vaultId: string }
  | { phase: "error"; message: string };

const C = {
  bg: "#0A1628",
  panel: "#12243A",
  panelEdge: "#1E3A5C",
  text: "#E8DFD0",
  dim: "#6B9BD1",
  accent: "#D4A574",
};

const AGG = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL;
const SUISCAN_OBJ = (id: string) => `https://suiscan.xyz/testnet/object/${id}`;
const short = (s: string) => (s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s);

export default function PulsePage() {
  const account = useLetheAccount();
  const memory = useMemory();
  const [state, setState] = useState<State>({ phase: "loading" });
  const [briefing, setBriefing] = useState<string>("");
  const [briefingDone, setBriefingDone] = useState(false);
  const [granting, setGranting] = useState(false);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(async () => {
    if (!account) {
      setState({ phase: "signed-out" });
      return;
    }
    setState({ phase: "loading" });
    try {
      if (DEMO_MOCK) {
        // Dev mock: enforce the same grant rule against the in-memory vault.
        const vault = getMockOwnedMemory();
        if (!vault.authorized.includes(PULSE_APP_ADDRESS)) {
          setState({ phase: "denied", vaultId: vault.objectId });
          return;
        }
        const hits = memory ? await memory.recall("") : [];
        setState({
          phase: "granted",
          vaultId: vault.objectId,
          entries: hits.map((h) => ({ text: h.text, kind: h.kind, blobId: h.blobId, createdAtMs: h.createdAtMs })),
        });
        return;
      }

      const res = await fetch("/api/pulse/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerAddress: account.address }),
      });
      if (res.status === 403) {
        const body = (await res.json().catch(() => ({}))) as { vaultId?: string };
        setState({ phase: "denied", vaultId: body.vaultId ?? null });
        return;
      }
      if (res.status === 404) {
        setState({ phase: "no-vault" });
        return;
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err?.error ?? "Pulse couldn't reach your vault");
      }
      const { entries, vaultId } = (await res.json()) as { entries: PulseEntry[]; vaultId: string };
      setState({ phase: "granted", entries, vaultId });
    } catch (e) {
      setState({ phase: "error", message: e instanceof Error ? e.message : "Something went wrong" });
    }
  }, [account, memory]);

  useEffect(() => {
    void load();
  }, [load, nonce]);

  // Streamed briefing once granted — Pulse talking from the SAME memory.
  useEffect(() => {
    if (state.phase !== "granted" || state.entries.length === 0) return;
    let cancelled = false;
    setBriefing("");
    setBriefingDone(false);
    (async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context: state.entries.map((e) => e.text),
            messages: [
              {
                role: "user",
                content:
                  "You are Pulse, a portfolio companion reading my Lethe memory for the first time. In 2-3 sharp sentences, show me you already know my style and give me one pointed thought for today. Address me directly.",
              },
            ],
          }),
        });
        if (!res.ok || !res.body) throw new Error("briefing unavailable");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          const chunk = dec.decode(value, { stream: true });
          setBriefing((b) => b + chunk);
        }
      } catch {
        if (!cancelled)
          setBriefing("I've read your memory — your style is loaded. (Live briefing unavailable right now.)");
      } finally {
        if (!cancelled) setBriefingDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state]);

  async function grantPulse() {
    if (!memory || granting) return;
    setGranting(true);
    try {
      await memory.grant(PULSE_APP_ADDRESS);
      setNonce((n) => n + 1);
    } catch (e) {
      setState({ phase: "error", message: e instanceof Error ? e.message : "grant failed" });
    } finally {
      setGranting(false);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      <header className="border-b" style={{ borderColor: C.panelEdge }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-sans)", color: C.accent }}>
              ◍ Pulse
            </span>
            <span className="text-xs" style={{ color: C.dim }}>
              {PULSE_TAGLINE}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: C.dim }}>
            {DEMO_MOCK && (
              <span className="px-2 py-0.5 rounded border uppercase tracking-wide text-[10px]" style={{ borderColor: C.accent, color: C.accent }}>
                demo mock
              </span>
            )}
            {account && <span>{short(account.address)}</span>}
            <Link href="/" className="underline decoration-dotted underline-offset-2 hover:opacity-70">
              Lethe ↗
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {state.phase === "signed-out" && (
          <Card>
            <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>Pulse runs on your Lethe memory.</h1>
            <p className="mt-2 text-sm" style={{ color: C.dim }}>
              Sign in with Google on{" "}
              <Link href="/" className="underline" style={{ color: C.text }}>
                Lethe
              </Link>{" "}
              first — your memory vault travels with you, not with the app.
            </p>
          </Card>
        )}

        {state.phase === "loading" && (
          <div className="flex flex-col gap-4">
            <div className="lethe-shimmer h-8 w-2/3 rounded-lg" style={{ opacity: 0.25 }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl p-5 border" style={{ borderColor: C.panelEdge, background: C.panel }}>
                  <div className="lethe-shimmer h-3 w-20 rounded mb-3" style={{ opacity: 0.25 }} />
                  <div className="lethe-shimmer h-4 w-full rounded" style={{ opacity: 0.25 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {state.phase === "no-vault" && (
          <Card>
            <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>No memory vault yet.</h1>
            <p className="mt-2 text-sm" style={{ color: C.dim }}>
              Head to{" "}
              <Link href="/" className="underline" style={{ color: C.text }}>
                Lethe
              </Link>{" "}
              — your vault is minted the moment you sign in, then Pulse can read it (with your permission).
            </p>
          </Card>
        )}

        {state.phase === "denied" && (
          <Card accent>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: C.dim }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#C0564A" }} />
              access not granted
            </div>
            <h1 className="mt-3 text-3xl leading-snug" style={{ fontFamily: "var(--font-display)" }}>
              Your memory is yours.
              <br />
              Pulse can&apos;t see it.
            </h1>
            <p className="mt-3 text-sm max-w-lg leading-relaxed" style={{ color: C.dim }}>
              Pulse reads the same vault Lethe writes — but only while its app address is on your vault&apos;s
              on-chain authorized list. Right now it isn&apos;t, so Pulse knows nothing about you.
              {state.vaultId && (
                <>
                  {" "}
                  Verify live:{" "}
                  <a className="underline" style={{ color: C.text }} href={SUISCAN_OBJ(state.vaultId)} target="_blank" rel="noreferrer">
                    vault {short(state.vaultId)} ↗
                  </a>
                </>
              )}
            </p>
            <div className="mt-5 flex items-center gap-4">
              <button
                onClick={grantPulse}
                disabled={granting}
                className="h-11 px-5 rounded-lg text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{ background: C.accent, color: C.bg }}
              >
                {granting ? "Granting…" : "Grant Pulse access (gasless)"}
              </button>
              <Link href="/memory" className="text-xs underline" style={{ color: C.dim }}>
                manage in Your Memory →
              </Link>
            </div>
          </Card>
        )}

        {state.phase === "error" && (
          <Card>
            <p className="text-sm">Hmm — {state.message}.</p>
            <button onClick={() => setNonce((n) => n + 1)} className="mt-3 text-xs underline" style={{ color: C.dim }}>
              Try again
            </button>
          </Card>
        )}

        {state.phase === "granted" && (
          <>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: C.dim }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.accent }} />
              reading your Lethe memory · {state.entries.length} {state.entries.length === 1 ? "entry" : "entries"}
            </div>
            <h1 className="mt-3 text-3xl leading-snug" style={{ fontFamily: "var(--font-display)" }}>
              First time here — and I already know you.
            </h1>

            <div className="mt-5 rounded-2xl p-5 border" style={{ borderColor: C.accent + "55", background: C.panel }}>
              <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: C.accent }}>
                your pulse today
              </div>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {briefing || <span className="lethe-shimmer inline-block h-4 w-64 rounded" style={{ opacity: 0.25 }} />}
                {briefing && !briefingDone && (
                  <span className="inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom animate-pulse" style={{ background: C.dim }} />
                )}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {state.entries.map((e) => (
                <div key={e.blobId} className="lethe-card-in rounded-2xl p-4 border" style={{ borderColor: C.panelEdge, background: C.panel }}>
                  <div className="text-[10px] uppercase tracking-widest" style={{ color: C.dim }}>
                    {e.kind}
                  </div>
                  <p className="mt-1.5 text-sm leading-snug">{e.text}</p>
                  <div className="mt-2 text-[11px]" style={{ color: C.dim }}>
                    <a className="underline decoration-dotted underline-offset-2 hover:opacity-70" href={`${AGG}/v1/blobs/${e.blobId}`} target="_blank" rel="noreferrer" title="The encrypted blob on Walrus — Pulse never stored this; your vault did">
                      Walrus {short(e.blobId)} ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 text-xs leading-relaxed max-w-xl" style={{ color: C.dim }}>
              Pulse was never told any of this — it read your owned vault{" "}
              <a className="underline" href={SUISCAN_OBJ(state.vaultId)} target="_blank" rel="noreferrer" style={{ color: C.text }}>
                {short(state.vaultId)} ↗
              </a>
              . Revoke Pulse in{" "}
              <Link href="/memory" className="underline" style={{ color: C.text }}>
                Your Memory
              </Link>{" "}
              and it forgets you instantly.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className="rounded-2xl p-7 border"
      style={{ borderColor: accent ? C.accent + "55" : C.panelEdge, background: C.panel }}
    >
      {children}
    </div>
  );
}

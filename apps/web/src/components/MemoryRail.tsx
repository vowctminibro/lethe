"use client";

/**
 * Memory rail — the INK POOL.
 *
 * The one dark surface on the paper page: a pool of ink beside the chat where
 * memories settle. Chips lift in with a soft coral glow when a fact is
 * extracted, then anchor with a stamp once the Walrus blob + gasless
 * add_entry land on-chain. Every id is an engraved mono plate with a copy
 * affordance. Coral appears here because this IS the memory surface.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSealUnlocking } from "@/src/lib/memory/use-seal-unlock";
import { formatBytes } from "@/src/lib/format";

export interface RailEntry {
  id: string;
  kind: string;
  summary: string;
  status: "pending" | "confirmed" | "failed";
  createdAtMs: number;
  blobId?: string;
  /** add_entry tx digest (fresh writes only — historical entries link the vault). */
  digest?: string;
  /** Real stored blob size in bytes, when known (fresh write / recall). */
  size?: number;
  error?: string;
}

const AGG = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL;
const blobUrl = (id: string) => `${AGG}/v1/blobs/${id}`;
const SUISCAN_OBJ = (id: string) => `https://suiscan.xyz/testnet/object/${id}`;
const SUISCAN_TX = (d: string) => `https://suiscan.xyz/testnet/tx/${d}`;
const short = (s: string) => (s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s);

/* Ink-pool palette — local to the rail. */
const POOL = {
  bg: "#1A3A4A",
  panel: "rgba(239, 245, 244, 0.05)",
  text: "#EFF5F4",
  dim: "rgba(239, 245, 244, 0.55)",
  hairline: "rgba(239, 245, 244, 0.14)",
};

function timeAgo(ms: number): string {
  const d = Date.now() - ms;
  if (d < 90_000) return "just now";
  if (d < 3_600_000) return `${Math.round(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.round(d / 3_600_000)}h ago`;
  return new Date(ms).toLocaleDateString();
}

/** Engraved mono plate for an on-chain id, with copy affordance. */
function IdPlate({ id, href, label, title }: { id: string; href: string; label: string; title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span
      className="lethe-id inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded"
      style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${POOL.hairline}`, color: POOL.dim }}
    >
      <a className="hover:opacity-80 transition" style={{ color: "var(--accent)" }} href={href} target="_blank" rel="noreferrer" title={title}>
        {label} {short(id)} ↗
      </a>
      <button
        onClick={() => {
          void navigator.clipboard?.writeText(id);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
        className="hover:opacity-80 transition"
        style={{ color: copied ? "var(--accent)" : POOL.dim }}
        title={`Copy full ${label} id`}
        aria-label={`Copy ${label} id`}
      >
        {copied ? "✓" : "⧉"}
      </button>
    </span>
  );
}

function StatusMark({ status }: { status: RailEntry["status"] }) {
  if (status === "pending")
    return (
      <span className="relative flex w-2 h-2 shrink-0" title="Writing to Walrus + Sui…">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "var(--accent)" }} />
        <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: "var(--accent)" }} />
      </span>
    );
  if (status === "failed")
    return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#D97A6C" }} title="Write failed" />;
  return (
    <span className="shrink-0 text-[11px] leading-none" style={{ color: "var(--accent)" }} title="Anchored on-chain">
      ✓
    </span>
  );
}

function PoolLink({ href, children, title }: { href: string; children: ReactNode; title?: string }) {
  return (
    <a
      className="underline decoration-dotted underline-offset-2 hover:opacity-80 transition"
      style={{ color: POOL.dim }}
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
    >
      {children}
    </a>
  );
}

export function MemoryRail({
  entries,
  vaultId,
  loading,
}: {
  entries: RailEntry[];
  vaultId: string | null;
  loading: boolean;
}) {
  // Quiet one-time state while the per-session Seal decrypt key is signed.
  const unlocking = useSealUnlocking();
  // Stamp choreography: when a chip flips pending → confirmed, it gets one
  // stamp animation, then settles into its letterpress state.
  const wasPending = useRef<Set<string>>(new Set());
  const [stamped, setStamped] = useState<Set<string>>(new Set());
  useEffect(() => {
    const next = new Set(stamped);
    let changed = false;
    for (const e of entries) {
      if (e.status === "pending") wasPending.current.add(e.id);
      if (e.status === "confirmed" && wasPending.current.has(e.id) && !next.has(e.id)) {
        next.add(e.id);
        changed = true;
      }
    }
    if (changed) setStamped(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  return (
    <aside
      className="rounded border flex flex-col min-h-0 overflow-hidden"
      style={{ borderColor: "var(--border)", background: POOL.bg, color: POOL.text }}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-2" style={{ borderBottom: `1px solid ${POOL.hairline}` }}>
        <div className="lethe-id uppercase" style={{ color: POOL.dim }}>
          Memory
        </div>
        {vaultId && (
          <a
            className="lethe-id underline decoration-dotted underline-offset-2 hover:opacity-80 transition whitespace-nowrap"
            style={{ color: "var(--accent)" }}
            href={SUISCAN_OBJ(vaultId)}
            target="_blank"
            rel="noreferrer"
            title="Your Memory vault object on Sui"
          >
            vault {short(vaultId)} ↗
          </a>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
        {unlocking && (
          <div className="lethe-id px-2 py-1 text-center animate-pulse" style={{ color: POOL.dim }}>
            unlocking your memories…
          </div>
        )}
        {loading && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded border p-3" style={{ borderColor: POOL.hairline }}>
                <div className="lethe-shimmer h-3 w-16 rounded mb-2 opacity-30" />
                <div className="lethe-shimmer h-3.5 w-full rounded mb-1.5 opacity-30" />
                <div className="lethe-shimmer h-3 w-2/3 rounded opacity-30" />
              </div>
            ))}
          </>
        )}

        {!loading && entries.length === 0 && (
          <div className="text-xs leading-relaxed px-2 py-6 text-center" style={{ color: POOL.dim }}>
            Nothing remembered yet.
            <br />
            Tell Lethe something durable about yourself and watch it settle here — on Walrus, owned by you.
          </div>
        )}

        {!loading &&
          entries.map((e) => (
            <div
              key={e.id}
              className={`rounded p-3 ${
                e.status === "pending" ? "lethe-chip-lift" : stamped.has(e.id) ? "lethe-stamp" : "lethe-card-in"
              }`}
              style={{
                background: POOL.panel,
                border: `1px solid ${e.status === "failed" ? "rgba(217,122,108,0.5)" : POOL.hairline}`,
                boxShadow:
                  e.status === "confirmed"
                    ? "inset 0 1px 3px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(239,245,244,0.07)"
                    : undefined,
                opacity: e.status === "pending" ? 0.92 : 1,
              }}
            >
              <div className="flex items-center gap-2">
                <StatusMark status={e.status} />
                <span
                  className="lethe-id uppercase px-1.5 py-0.5 rounded"
                  style={{ color: "var(--accent)", border: "1px solid rgba(232,184,148,0.35)" }}
                >
                  {e.kind}
                </span>
                <span className="ml-auto text-[10px]" style={{ color: POOL.dim }}>
                  {e.status === "pending" ? "writing…" : timeAgo(e.createdAtMs)}
                </span>
              </div>

              <p className="mt-2 text-[13px] leading-snug" style={{ color: POOL.text }}>
                {e.summary}
              </p>

              {e.status === "failed" ? (
                <p className="mt-1.5 text-[11px]" style={{ color: "#D97A6C" }}>
                  {e.error ?? "Couldn't write this memory — try again."}
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 items-center">
                  {e.blobId ? (
                    <IdPlate id={e.blobId} href={blobUrl(e.blobId)} label="walrus" title="Raw encrypted blob on the Walrus aggregator" />
                  ) : (
                    <span className="lethe-shimmer inline-block h-3 w-24 rounded opacity-30" />
                  )}
                  {e.digest ? (
                    <IdPlate id={e.digest} href={SUISCAN_TX(e.digest)} label="tx" title="The gasless add_entry transaction on Suiscan" />
                  ) : vaultId && e.status === "confirmed" ? (
                    <PoolLink href={SUISCAN_OBJ(vaultId)} title="Referenced on your vault object">
                      vault ↗
                    </PoolLink>
                  ) : null}
                </div>
              )}

              {e.status === "confirmed" && (
                <p className="mt-1.5 text-[10px]" style={{ color: POOL.dim }} title="This memory is real WAL-backed Walrus storage">
                  stored on Walrus
                  {formatBytes(e.size) && <> · <span className="lethe-id">{formatBytes(e.size)}</span></>}
                </p>
              )}
            </div>
          ))}
      </div>

      <div className="px-4 py-2.5 text-center" style={{ borderTop: `1px solid ${POOL.hairline}` }}>
        <a
          className="text-[11px] underline decoration-dotted underline-offset-2 hover:opacity-80 transition"
          style={{ color: POOL.dim }}
          href="/memory"
          title="View, verify, or forget any memory"
        >
          manage / forget →
        </a>
      </div>
    </aside>
  );
}

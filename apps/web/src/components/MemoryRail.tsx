"use client";

/**
 * Memory rail — the visible "memory being written" moment (hero 0:15–0:40).
 *
 * A right-side column beside the chat. Existing on-chain entries load in from
 * the vault; each newly extracted fact animates in as a chip that goes
 * pending → confirmed once its Walrus blob + gasless add_entry land, with live
 * Walrus/Suiscan links. The trust surface IS the product, so every confirmed
 * chip is independently verifiable.
 */

import type { ReactNode } from "react";

export interface RailEntry {
  id: string;
  kind: string;
  summary: string;
  status: "pending" | "confirmed" | "failed";
  createdAtMs: number;
  blobId?: string;
  /** add_entry tx digest (fresh writes only — historical entries link the vault). */
  digest?: string;
  error?: string;
}

const AGG = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL;
const blobUrl = (id: string) => `${AGG}/v1/blobs/${id}`;
const SUISCAN_OBJ = (id: string) => `https://suiscan.xyz/testnet/object/${id}`;
const SUISCAN_TX = (d: string) => `https://suiscan.xyz/testnet/tx/${d}`;
const short = (s: string) => (s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s);

function timeAgo(ms: number): string {
  const d = Date.now() - ms;
  if (d < 90_000) return "just now";
  if (d < 3_600_000) return `${Math.round(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.round(d / 3_600_000)}h ago`;
  return new Date(ms).toLocaleDateString();
}

function StatusDot({ status }: { status: RailEntry["status"] }) {
  if (status === "pending")
    return (
      <span className="relative flex w-2 h-2 shrink-0" title="Writing to Walrus + Sui…">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "var(--accent-h)" }} />
        <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: "var(--accent-h)" }} />
      </span>
    );
  if (status === "failed")
    return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#C0564A" }} title="Write failed" />;
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#5A8A9E" }} title="Confirmed on-chain" />;
}

function ChipLink({ href, children, title }: { href: string; children: ReactNode; title?: string }) {
  return (
    <a className="underline decoration-dotted underline-offset-2 hover:opacity-70 transition" href={href} target="_blank" rel="noreferrer" title={title}>
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
  return (
    <aside
      className="rounded-2xl border flex flex-col min-h-0 overflow-hidden"
      style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}
    >
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div className="text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: "var(--text-dim)" }}>
          Memory
        </div>
        {vaultId && (
          <a
            className="text-[11px] underline decoration-dotted underline-offset-2 hover:opacity-70 transition"
            style={{ color: "var(--text-dim)" }}
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
        {loading && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                <div className="lethe-shimmer h-3 w-16 rounded mb-2" />
                <div className="lethe-shimmer h-3.5 w-full rounded mb-1.5" />
                <div className="lethe-shimmer h-3 w-2/3 rounded" />
              </div>
            ))}
          </>
        )}

        {!loading && entries.length === 0 && (
          <div className="text-xs leading-relaxed px-2 py-6 text-center" style={{ color: "var(--text-dim)" }}>
            Nothing remembered yet.
            <br />
            Tell Lethe something durable about yourself and watch it land here — on Walrus, owned by you.
          </div>
        )}

        {!loading &&
          entries.map((e) => (
            <div
              key={e.id}
              className="lethe-card-in rounded-xl border p-3"
              style={{
                borderColor: e.status === "failed" ? "#C0564A55" : "var(--border)",
                background: "var(--bg)",
                opacity: e.status === "pending" ? 0.85 : 1,
              }}
            >
              <div className="flex items-center gap-2">
                <StatusDot status={e.status} />
                <span
                  className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
                  style={{ background: "var(--bg-panel)", color: "var(--text-dim)", border: "1px solid var(--border)" }}
                >
                  {e.kind}
                </span>
                <span className="ml-auto text-[10px]" style={{ color: "var(--text-dim)" }}>
                  {e.status === "pending" ? "writing…" : timeAgo(e.createdAtMs)}
                </span>
              </div>

              <p className="mt-1.5 text-[13px] leading-snug" style={{ color: "var(--text)" }}>
                {e.summary}
              </p>

              {e.status === "failed" ? (
                <p className="mt-1.5 text-[11px]" style={{ color: "#C0564A" }}>
                  {e.error ?? "Couldn't write this memory — try again."}
                </p>
              ) : (
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]" style={{ color: "var(--text-dim)" }}>
                  {e.blobId ? (
                    <ChipLink href={blobUrl(e.blobId)} title="Raw encrypted blob on the Walrus aggregator">
                      Walrus {short(e.blobId)} ↗
                    </ChipLink>
                  ) : (
                    <span className="lethe-shimmer inline-block h-3 w-24 rounded" />
                  )}
                  {e.digest ? (
                    <ChipLink href={SUISCAN_TX(e.digest)} title="The gasless add_entry transaction on Suiscan">
                      Suiscan tx ↗
                    </ChipLink>
                  ) : vaultId && e.status === "confirmed" ? (
                    <ChipLink href={SUISCAN_OBJ(vaultId)} title="Referenced on your vault object">
                      Suiscan ↗
                    </ChipLink>
                  ) : null}
                </div>
              )}
            </div>
          ))}
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { SiteHeader } from "@/src/components/SiteHeader";
import {
  TRAIT_CATEGORIES,
  defaultSelection,
  traitsToString,
  selectionLabels,
  computeRarity,
  type Rarity,
  type TraitSelection,
} from "@/src/lib/traits";
import { useMintArtwork } from "@/src/lib/mint";
import house from "@/src/data/house-artworks.json";

const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet";
const AGG = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL;
const txUrl = (d: string) => `https://suiscan.xyz/${NETWORK}/tx/${d}`;
const objUrl = (id: string) => `https://suiscan.xyz/${NETWORK}/object/${id}`;
const MAX_REGENS = 2;

/** One proof receipt row: label, monospace value, optional sub + external link. */
function Receipt({
  label,
  value,
  sub,
  href,
  cta,
  note,
  rawUrl,
  rawLabel,
}: {
  label: string;
  value: string;
  sub?: string;
  href: string;
  cta: string;
  note?: string;
  /** Canonical URL shown as copyable monospace text (e.g. the Walrus aggregator URL). */
  rawUrl?: string;
  rawLabel?: string;
}) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>{label}</span>
        <a href={href} target="_blank" rel="noreferrer" className="text-xs underline shrink-0">{cta}</a>
      </div>
      <div className="mt-0.5 font-mono text-sm break-all">
        {value}
        {sub ? <span style={{ color: "var(--text-dim)" }}> · {sub}</span> : null}
      </div>
      {rawUrl ? (
        <div className="mt-1">
          {rawLabel ? <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>{rawLabel} </span> : null}
          <span className="text-[11px] font-mono break-all select-all" style={{ color: "var(--text-dim)" }}>{rawUrl}</span>
        </div>
      ) : null}
      {note ? <div className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{note}</div> : null}
    </div>
  );
}

interface HousePiece {
  id: string;
  label: string;
  traits: TraitSelection;
  prompt: string;
  rarity: Rarity;
  blobId: string;
}
const SAMPLES = (house as { artworks: HousePiece[] }).artworks;

interface Preview {
  /** data: URL (live gen) or /api/img/<blobId> (pre-baked sample). */
  src: string;
  /** present for live gen — used for the Walrus upload on mint. */
  base64?: string;
  prompt: string;
  rarity: Rarity;
}
interface Blob {
  blobId: string;
  aggregatorUrl: string;
  size?: number;
}

const short = (s: string, head = 10, tail = 6) =>
  s && s.length > head + tail ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;
const fmtBytes = (n?: number) =>
  typeof n === "number" ? (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(0)} KB`) : "";
type Status = "idle" | "generating" | "preview" | "storing" | "minting" | "done";

export default function CreatePage() {
  const account = useCurrentAccount();
  const { mint } = useMintArtwork();

  const [selection, setSelection] = useState<TraitSelection>(defaultSelection());
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [digest, setDigest] = useState<string | null>(null);
  const [objectId, setObjectId] = useState<string | null>(null);
  const [gasOwner, setGasOwner] = useState<string | null>(null);
  const [regens, setRegens] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sampleIdx, setSampleIdx] = useState(0);
  const [proofDismissed, setProofDismissed] = useState(false);

  /** Load a pre-baked house piece (already on Walrus) so the OWN step is
   *  reachable instantly — the safe demo path if live gen is slow/flaky. */
  function loadSample() {
    if (SAMPLES.length === 0) return;
    const s = SAMPLES[sampleIdx % SAMPLES.length];
    setSampleIdx((i) => i + 1);
    setSelection(s.traits);
    setPreview({ src: `/api/img/${s.blobId}`, prompt: s.prompt, rarity: s.rarity });
    setBlob({ blobId: s.blobId, aggregatorUrl: `${AGG}/v1/blobs/${s.blobId}` });
    setDigest(null);
    setObjectId(null);
    setGasOwner(null);
    setRegens(0);
    setError(null);
    setStatus("preview");
  }

  function pick(catId: string, optId: string) {
    setSelection((s) => ({ ...s, [catId]: optId }));
    // changing traits invalidates the current preview
    setPreview(null);
    setBlob(null);
    setDigest(null);
    setObjectId(null);
    setGasOwner(null);
    setRegens(0);
    setStatus("idle");
  }

  async function generate(isRegen: boolean) {
    setError(null);
    setStatus("generating");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traits: selection }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "generation failed");
      setPreview({
        src: `data:${j.mime};base64,${j.imageBase64}`,
        base64: j.imageBase64,
        prompt: j.prompt,
        rarity: j.rarity,
      });
      setBlob(null);
      setDigest(null);
      if (isRegen) setRegens((n) => n + 1);
      setStatus("preview");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setError(`Generation failed — ${msg}. Please try again.`);
      setStatus("idle");
    }
  }

  async function mintIt() {
    if (!preview) return;
    setError(null);
    setProofDismissed(false);
    setStatus("storing");
    let stored = false;
    try {
      // Phase D — image goes to Walrus first (load-bearing). Reuse an existing
      // blob if this image was already uploaded (e.g. retry after a mint error).
      let current = blob;
      if (!current) {
        if (!preview.base64) throw new Error("no image data to upload");
        const sres = await fetch("/api/store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: preview.base64 }),
        });
        const sj = await sres.json();
        if (!sres.ok) throw new Error(sj.error ?? "upload rejected");
        current = { blobId: sj.blobId, aggregatorUrl: sj.aggregatorUrl, size: sj.size };
        setBlob(current);
      }
      stored = true;

      // Phase E — gasless sponsored mint
      setStatus("minting");
      const { digest: d, objectId: oid, gasOwner: go } = await mint({
        blobId: current.blobId,
        prompt: preview.prompt,
        traits: traitsToString(selection),
      });
      setDigest(d);
      setObjectId(oid);
      setGasOwner(go);
      setStatus("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      // Walrus may have succeeded even if mint is blocked — keep blob visible.
      setError(stored ? `Mint failed — ${msg}` : `Walrus upload failed — ${msg}. Try again.`);
      setStatus("preview");
    }
  }

  const busy = status === "generating" || status === "storing" || status === "minting";

  // Loading line: "Generating your [tier] [color] [species]…" from the picked traits.
  const genLabels = selectionLabels(selection); // [species, color, accessory, background]
  let genTier = "";
  try {
    genTier = computeRarity(selection).tier;
  } catch {
    /* incomplete selection — leave tier blank */
  }
  const loadingLine = `Generating your ${genTier} ${genLabels[1]} ${genLabels[0]}…`
    .replace(/\s+/g, " ")
    .trim();

  return (
    <main className="min-h-screen" style={{ color: "var(--text)" }}>
      <SiteHeader active="create" />
      <div className="max-w-5xl mx-auto px-6 pb-16">
      <h1 className="mt-4 text-3xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        Create your collectible
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-dim)" }}>
        Pick traits — the AI generates in one locked style. No prompt writing.
      </p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ── Trait menu ── */}
        <div className="space-y-6">
          {TRAIT_CATEGORIES.map((cat) => (
            <div key={cat.id}>
              <div className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--text-dim)" }}>{cat.label}</div>
              <div className="flex flex-wrap gap-2">
                {cat.options.map((opt) => {
                  const active = selection[cat.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => pick(cat.id, opt.id)}
                      className="px-3 h-9 rounded-md text-sm border transition"
                      style={{
                        borderColor: active ? "var(--text)" : "var(--border)",
                        background: active ? "var(--text)" : "var(--bg-panel)",
                        color: active ? "var(--accent)" : "var(--text)",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => generate(false)}
              disabled={busy}
              className="h-11 px-6 rounded-md font-semibold disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--text)" }}
            >
              {status === "generating" ? "Generating…" : "Generate"}
            </button>
            {preview && (
              <button
                onClick={() => generate(true)}
                disabled={busy || regens >= MAX_REGENS}
                className="h-11 px-4 rounded-md text-sm border disabled:opacity-40"
                style={{ borderColor: "var(--border)" }}
                title={regens >= MAX_REGENS ? "Regen limit reached" : "Regenerate same traits"}
              >
                Regenerate ({MAX_REGENS - regens} left)
              </button>
            )}
          </div>

          {SAMPLES.length > 0 && (
            <button
              onClick={loadSample}
              disabled={busy}
              className="text-xs underline disabled:opacity-40"
              style={{ color: "var(--text-dim)" }}
            >
              or try a sample piece (instant) →
            </button>
          )}
        </div>

        {/* ── Preview / mint ── */}
        <div>
          <div
            className="aspect-square w-full rounded-xl border grid place-items-center overflow-hidden relative"
            style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}
          >
            {status === "generating" ? (
              <div className="absolute inset-0 lethe-shimmer grid place-items-center">
                <div className="text-center px-8">
                  <div className="text-base" style={{ fontFamily: "var(--font-display)" }}>{loadingLine}</div>
                  <div className="mt-2 text-[11px] tracking-wide" style={{ color: "var(--text-dim)" }}>
                    one locked style · rendering on MiniMax
                  </div>
                </div>
              </div>
            ) : preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={preview.src}
                src={preview.src}
                alt="generated collectible"
                className="w-full h-full object-cover lethe-fade-in"
              />
            ) : (
              <span className="text-sm" style={{ color: "var(--text-dim)" }}>Your collectible appears here</span>
            )}
          </div>

          {preview && status !== "generating" && (
            <div className="mt-4 space-y-3">
              <div className="lethe-reveal flex items-center justify-between text-sm">
                <span style={{ color: "var(--text-dim)" }}>Rarity</span>
                <span className="font-semibold px-2 py-0.5 rounded" style={{ border: "1px solid var(--accent)" }}>
                  {preview.rarity.tier} · 1 in {preview.rarity.score} ({preview.rarity.percent}%)
                </span>
              </div>

              {!digest && (
                <button
                  onClick={mintIt}
                  disabled={busy || !account}
                  className="w-full h-11 rounded-md font-semibold disabled:opacity-50"
                  style={{ background: "var(--text)", color: "var(--accent)" }}
                >
                  {status === "storing"
                    ? "Saving to Walrus…"
                    : status === "minting"
                      ? "Minting (gasless)…"
                      : account
                        ? "Mint & own"
                        : "Sign in to mint"}
                </button>
              )}

              {blob && !digest && status !== "storing" && status !== "minting" && (
                <div className="text-xs" style={{ color: "var(--text-dim)" }}>
                  Stored on Walrus ✓ <span className="font-mono">{short(blob.blobId)}</span>
                </div>
              )}

              {error && (
                <div className="text-xs p-3 rounded-md border" style={{ borderColor: "var(--accent-h)", color: "var(--text)" }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ── Post-mint proof moment ── */}
      {digest && !proofDismissed && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4 lethe-overlay-in"
          style={{ background: "rgba(10,22,40,0.55)" }}
          onClick={() => setProofDismissed(true)}
        >
          <div
            className="lethe-card-in w-full max-w-md rounded-2xl border p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--bg-panel)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Minted</div>
                <h2 className="text-2xl mt-0.5" style={{ fontFamily: "var(--font-display)" }}>It&apos;s real, and it&apos;s yours.</h2>
              </div>
              <button onClick={() => setProofDismissed(true)} aria-label="Close" className="text-2xl leading-none px-1" style={{ color: "var(--text-dim)" }}>×</button>
            </div>

            <div className="mt-4 flex gap-4 items-center">
              <div className="w-24 h-24 rounded-lg overflow-hidden border shrink-0" style={{ borderColor: "var(--border)" }}>
                {blob && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/img/${encodeURIComponent(blob.blobId)}`} alt="your collectible" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="text-sm">
                <div className="font-semibold">{selectionLabels(selection).join(" · ")}</div>
                {preview && (
                  <div style={{ color: "var(--text-dim)" }}>{preview.rarity.tier} · 1 in {preview.rarity.score}</div>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {blob && (
                <Receipt
                  label="Stored on Walrus"
                  value={short(blob.blobId)}
                  sub={fmtBytes(blob.size)}
                  href={`/api/img/${encodeURIComponent(blob.blobId)}`}
                  cta="View on Walrus ↗"
                  rawUrl={blob.aggregatorUrl}
                  rawLabel="Walrus blob"
                  note="The image lives on decentralized storage — not our server."
                />
              )}
              <Receipt
                label="Owned on Sui"
                value={objectId ? short(objectId) : short(digest)}
                href={objectId ? objUrl(objectId) : txUrl(digest)}
                cta={objectId ? "View on Sui Explorer ↗" : "View transaction ↗"}
                note={account ? `Owner ${short(account.address, 6, 4)}` : undefined}
              />
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                <div className="text-xs uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>Gasless</div>
                <div className="mt-0.5 text-sm">Gas paid by sponsor · you paid <strong>0 SUI</strong></div>
                {gasOwner && (
                  <div className="text-xs font-mono mt-0.5" style={{ color: "var(--text-dim)" }}>sponsor {short(gasOwner, 6, 4)}</div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href="/me" className="flex-1 h-11 rounded-md font-semibold grid place-items-center" style={{ background: "var(--text)", color: "var(--accent)" }}>
                View in My Collection →
              </Link>
              <Link href="/battle" className="flex-1 h-11 rounded-md font-semibold grid place-items-center border" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                Enter a battle →
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useCurrentAccount,
  useConnectWallet,
  useWallets,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { isGoogleWallet } from "@mysten/enoki";
import {
  TRAIT_CATEGORIES,
  defaultSelection,
  traitsToString,
  type Rarity,
  type TraitSelection,
} from "@/src/lib/traits";
import { useMintArtwork } from "@/src/lib/mint";

const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet";
const txUrl = (d: string) => `https://suiscan.xyz/${NETWORK}/tx/${d}`;
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const MAX_REGENS = 2;

interface Preview {
  base64: string;
  mime: string;
  prompt: string;
  rarity: Rarity;
}
interface Blob {
  blobId: string;
  aggregatorUrl: string;
}
type Status = "idle" | "generating" | "preview" | "storing" | "minting" | "done";

function SignIn() {
  const account = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: connect, isPending } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const google = wallets.find((w) => isGoogleWallet(w));

  if (account) {
    return (
      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-dim)" }}>
        <span>signed in · {short(account.address)}</span>
        <button onClick={() => disconnect()} className="underline hover:opacity-70">sign out</button>
      </div>
    );
  }
  if (!google) {
    return (
      <span className="text-xs" style={{ color: "var(--text-dim)" }}>
        Sign-in unavailable — set NEXT_PUBLIC_ENOKI_API_KEY to enable Google zkLogin.
      </span>
    );
  }
  return (
    <button
      onClick={() => connect({ wallet: google })}
      disabled={isPending}
      className="h-10 px-4 rounded-md text-sm font-semibold disabled:opacity-50"
      style={{ background: "var(--text)", color: "var(--accent)" }}
    >
      {isPending ? "Connecting…" : "Sign in with Google"}
    </button>
  );
}

export default function CreatePage() {
  const account = useCurrentAccount();
  const { mint } = useMintArtwork();

  const [selection, setSelection] = useState<TraitSelection>(defaultSelection());
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [digest, setDigest] = useState<string | null>(null);
  const [regens, setRegens] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function pick(catId: string, optId: string) {
    setSelection((s) => ({ ...s, [catId]: optId }));
    // changing traits invalidates the current preview
    setPreview(null);
    setBlob(null);
    setDigest(null);
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
      setPreview({ base64: j.imageBase64, mime: j.mime, prompt: j.prompt, rarity: j.rarity });
      setBlob(null);
      setDigest(null);
      if (isRegen) setRegens((n) => n + 1);
      setStatus("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "generation failed");
      setStatus("idle");
    }
  }

  async function mintIt() {
    if (!preview) return;
    setError(null);
    setStatus("storing");
    try {
      // Phase D — image goes to Walrus first (load-bearing)
      const sres = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: preview.base64 }),
      });
      const sj = await sres.json();
      if (!sres.ok) throw new Error(sj.error ?? "Walrus store failed");
      setBlob({ blobId: sj.blobId, aggregatorUrl: sj.aggregatorUrl });

      // Phase E — gasless sponsored mint
      setStatus("minting");
      const { digest: d } = await mint({
        blobId: sj.blobId,
        prompt: preview.prompt,
        traits: traitsToString(selection),
      });
      setDigest(d);
      setStatus("done");
    } catch (e) {
      // Walrus may have succeeded even if mint is blocked — keep blob visible.
      setError(e instanceof Error ? e.message : "mint failed");
      setStatus("preview");
    }
  }

  const busy = status === "generating" || status === "storing" || status === "minting";

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-6 py-8" style={{ color: "var(--text)" }}>
      <header className="flex items-center justify-between">
        <Link href="/" className="font-display text-xl" style={{ fontFamily: "var(--font-display)" }}>lethe</Link>
        <SignIn />
      </header>

      <h1 className="mt-8 text-3xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
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
        </div>

        {/* ── Preview / mint ── */}
        <div>
          <div
            className="aspect-square w-full rounded-xl border grid place-items-center overflow-hidden"
            style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:${preview.mime};base64,${preview.base64}`}
                alt="generated collectible"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm" style={{ color: "var(--text-dim)" }}>
                {status === "generating" ? "Generating…" : "Your collectible appears here"}
              </span>
            )}
          </div>

          {preview && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--text-dim)" }}>Rarity</span>
                <span className="font-semibold">{preview.rarity.tier} · 1 in {preview.rarity.score} ({preview.rarity.percent}%)</span>
              </div>

              {!digest && (
                <button
                  onClick={mintIt}
                  disabled={busy || !account}
                  className="w-full h-11 rounded-md font-semibold disabled:opacity-50"
                  style={{ background: "var(--text)", color: "var(--accent)" }}
                >
                  {status === "storing" ? "Saving to Walrus…" : status === "minting" ? "Minting…" : account ? "Mint & own" : "Sign in to mint"}
                </button>
              )}

              {blob && (
                <div className="text-xs p-3 rounded-md border" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
                  <div className="font-semibold" style={{ color: "var(--text)" }}>Stored on Walrus ✓</div>
                  <div className="mt-1 break-all">blobId: {blob.blobId}</div>
                  <a href={blob.aggregatorUrl} target="_blank" rel="noreferrer" className="underline">open on aggregator ↗</a>
                </div>
              )}

              {digest && (
                <div className="text-xs p-3 rounded-md border" style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}>
                  <div className="font-semibold" style={{ color: "var(--text)" }}>Minted on Sui ✓ (gasless)</div>
                  <a href={txUrl(digest)} target="_blank" rel="noreferrer" className="underline break-all">view transaction ↗</a>
                  <div className="mt-1"><Link href="/me" className="underline">see it in your collection →</Link></div>
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
    </main>
  );
}

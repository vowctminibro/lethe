import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* ── Nav ── */}
      <nav className="max-w-5xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            lethe
          </span>
          <span className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: "var(--text-dim)", color: "var(--text-dim)" }}>
            Sui Overflow 2026
          </span>
        </div>
        <Link href="/me" className="text-sm hover:opacity-70 transition" style={{ color: "var(--text-dim)" }}>
          My collection
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="flex-1 max-w-3xl mx-auto w-full px-6 flex flex-col items-center justify-center text-center gap-8 py-20">
        <div className="inline-flex items-center gap-2 text-xs opacity-60">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--accent)" }} />
          AI art collectibles on Sui
        </div>

        <h1
          className="text-5xl md:text-6xl leading-[1.05] tracking-tight"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400, color: "var(--text)" }}
        >
          Create your collectible.
          <br />
          Own it on-chain.
        </h1>

        <p className="text-lg max-w-xl leading-relaxed" style={{ color: "var(--text-dim)" }}>
          Pick traits from a curated menu and the AI generates a one-of-a-kind collectible
          in one consistent style. Your image is stored on Walrus; the piece becomes a Sui
          NFT you own — sign in with Google, no wallet, no gas.
        </p>

        <div className="flex flex-col items-center gap-3">
          <Link
            href="/create"
            className="h-12 px-6 rounded-md font-semibold grid place-items-center hover:opacity-90 transition"
            style={{ background: "var(--text)", color: "var(--accent)", fontFamily: "var(--font-sans)" }}
          >
            Create yours
          </Link>
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>
            Google sign-in via zkLogin · stored on Walrus · gasless mint
          </span>
        </div>

        {/* ── Three pillars ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8 text-left">
          {[
            { k: "Create", v: "Curated traits → one locked style. A coherent generative collection, AI-made." },
            { k: "Own", v: "Each piece is a Sui NFT minted to your zkLogin address — gasless via Enoki." },
            { k: "Stored on Walrus", v: "The artwork lives on Walrus; the blob id is embedded on-chain." },
          ].map((c) => (
            <div key={c.k} className="p-4 rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{c.k}</div>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-dim)" }}>{c.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="max-w-5xl mx-auto w-full px-6 py-8 text-xs flex items-center justify-between"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-dim)" }}
      >
        <span>Lethe — Walrus track, Sui Overflow 2026</span>
        <a href="https://github.com/vowctminibro/lethe" className="hover:opacity-70 transition">GitHub</a>
      </footer>
    </main>
  );
}

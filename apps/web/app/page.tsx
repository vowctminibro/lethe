import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* ── Nav ── */}
      <nav className="max-w-5xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/brand/lethe-mark-light.svg" alt="" className="w-10 h-10" />
          <span className="font-display text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            lethe
          </span>
          <span className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: "var(--text-dim)", color: "var(--text-dim)" }}>
            Sui Overflow 2026
          </span>
        </div>
        <Link
          href="/library"
          className="text-sm hover:opacity-70 transition"
          style={{ color: "var(--text-dim)" }}
        >
          My library
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="flex-1 max-w-3xl mx-auto w-full px-6 flex flex-col items-center justify-center text-center gap-8 py-20">
        <div className="inline-flex items-center gap-2 text-xs opacity-60">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--accent)" }} />
          Persistent AI storytelling
        </div>

        <h1
          className="text-5xl md:text-6xl leading-[1.05] tracking-tight"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400, color: "var(--text)" }}
        >
          Write a story that
          <br />
          remembers itself.
        </h1>

        <p className="text-lg max-w-xl leading-relaxed" style={{ color: "var(--text-dim)" }}>
          Pick a world. The AI writes the opening; you steer what happens next.
          Every chapter lives on Walrus and your story becomes a Sui NFT you own — no wallet, no seed phrase.
        </p>

        <div className="flex flex-col items-center gap-3">
          <Link
            href="/play"
            className="h-12 px-6 rounded-md font-semibold grid place-items-center hover:opacity-90 transition"
            style={{ background: "var(--text)", color: "var(--accent)", fontFamily: "var(--font-sans)" }}
          >
            Sign in with Google
          </Link>
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>
            zkLogin creates your Sui address invisibly
          </span>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="max-w-5xl mx-auto w-full px-6 py-8 text-xs flex items-center justify-between"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-dim)" }}
      >
        <span>Lethe — Walrus track, Sui Overflow 2026</span>
        <a href="https://github.com/vowctminibro/lethe" className="hover:opacity-70 transition">
          GitHub
        </a>
      </footer>
    </main>
  );
}

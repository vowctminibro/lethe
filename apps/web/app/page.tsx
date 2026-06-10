import Link from "next/link";
import { Logo } from "@/src/components/Logo";
import { HeroCTA } from "@/src/components/HeroCTA";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* ── Nav ── */}
      <nav className="max-w-5xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: "var(--text-dim)", color: "var(--text-dim)" }}>
            Sui Overflow 2026
          </span>
        </div>
        <Link href="/memory" className="text-sm hover:opacity-70 transition" style={{ color: "var(--text-dim)" }}>
          Your Memory
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="flex-1 max-w-3xl mx-auto w-full px-6 flex flex-col items-center justify-center text-center gap-8 py-20">
        <div className="inline-flex items-center gap-2 text-xs opacity-60">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--accent)" }} />
          Owned AI memory on Walrus
        </div>

        <h1
          className="text-5xl md:text-6xl leading-[1.05] tracking-tight"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400, color: "var(--text)" }}
        >
          Your AI remembers you —
          <br />
          and the memory is yours.
        </h1>

        <p className="text-lg max-w-xl leading-relaxed" style={{ color: "var(--text-dim)" }}>
          Lethe learns your on-chain style and saves what it knows on Walrus: owned by you,
          verifiable, and portable across apps. Sign in with Google — no wallet, no gas.
        </p>

        <HeroCTA />

        {/* ── Three pillars ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8 text-left">
          {[
            { k: "Remembers", v: "Tell Lethe your crypto style. It remembers across sessions, not just this chat." },
            { k: "You own it", v: "Every memory is a Walrus blob, referenced by a Sui object you control. Verify or revoke anytime." },
            { k: "Portable", v: "Your memory is not trapped in one app. Open another Lethe agent and it already knows you." },
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

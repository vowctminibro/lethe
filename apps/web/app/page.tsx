import Link from "next/link";
import { Logo } from "@/src/components/Logo";
import { HeroCTA } from "@/src/components/HeroCTA";

/**
 * Landing — "Letterpress on water".
 * Asymmetric editorial layout: verse tagline left, memory-constellation
 * line-work right, colophon footer. Coral appears only where memory does.
 */

/** Memory constellation — the vault and the agents that read it, as line-work. */
function Constellation() {
  return (
    <svg
      viewBox="0 0 560 520"
      className="w-full h-auto select-none"
      aria-hidden="true"
      fill="none"
    >
      {/* spokes */}
      <g stroke="#5A8A9E" strokeWidth="1" opacity="0.45">
        <path d="M280 260 L120 110" />
        <path d="M280 260 L452 96" />
        <path d="M280 260 L468 400" />
        <path d="M280 260 L120 416" strokeDasharray="3 6" />
      </g>
      {/* memory motes along the spokes — coral, the color of remembrance */}
      <g fill="#E8B894">
        <circle cx="200" cy="185" r="3" />
        <circle cx="366" cy="178" r="3" />
        <circle cx="374" cy="330" r="3" />
        <circle cx="232" cy="222" r="2" />
        <circle cx="412" cy="135" r="2" />
      </g>
      {/* agent nodes */}
      <g stroke="#1A3A4A" strokeWidth="1">
        <circle cx="120" cy="110" r="26" fill="#FFFFFF" />
        <circle cx="452" cy="96" r="26" fill="#FFFFFF" />
        <circle cx="468" cy="400" r="26" fill="#FFFFFF" />
        <circle cx="120" cy="416" r="26" fill="none" strokeDasharray="3 5" opacity="0.6" />
      </g>
      <g fill="#5A8A9E" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.08em" textAnchor="middle">
        <text x="120" y="114">LETHE</text>
        <text x="452" y="100">PULSE</text>
        <text x="468" y="404">NEXT</text>
        <text x="120" y="420" opacity="0.7">YOURS</text>
      </g>
      {/* the vault — ink disc, L mark, coral point */}
      <circle cx="280" cy="260" r="52" fill="#1A3A4A" />
      <text
        x="276"
        y="278"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fontSize="52"
        fill="#EFF5F4"
        textAnchor="middle"
      >
        L
      </text>
      <circle cx="312" cy="276" r="4" fill="#E8B894" />
      <text x="280" y="346" fill="#5A8A9E" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="0.08em" textAnchor="middle">
        ONE VAULT — YOURS
      </text>
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* ── Nav ── */}
      <nav className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="lethe-id px-2 py-0.5 lethe-hairline rounded" style={{ color: "var(--text-dim)" }}>
            SUI OVERFLOW 2026
          </span>
        </div>
        <Link href="/memory" className="text-sm hover:opacity-70 transition" style={{ color: "var(--text-dim)" }}>
          Your Memory
        </Link>
      </nav>

      {/* ── Hero — asymmetric: verse left, constellation right ── */}
      <section className="lethe-water flex-1 w-full overflow-hidden">
        <div className="max-w-6xl mx-auto w-full px-6 pt-14 pb-20 grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-12 items-center relative">
          <div className="relative">
            <h1 className="lethe-display" style={{ color: "var(--text)" }}>
              Named after the river
              <br />
              of forgetting.
              <br />
              <span style={{ fontStyle: "normal", fontWeight: 500 }}>Built so nothing is.</span>
            </h1>

            <p className="mt-8 text-base max-w-md leading-relaxed" style={{ color: "var(--text-dim)" }}>
              Lethe is user-owned memory for AI agents — stored on Walrus, anchored on Sui,
              portable across every app. Sign in with Google — no wallet, no gas.
            </p>

            <div className="mt-9">
              <HeroCTA />
            </div>
          </div>

          <div className="relative hidden lg:block" aria-hidden="true">
            <Constellation />
          </div>
        </div>
      </section>

      {/* ── Section divider — water line-work ── */}
      <div className="lethe-divider" aria-hidden="true" />

      {/* ── Three pillars — editorial margin notes, not cards ── */}
      <section className="max-w-6xl mx-auto w-full px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:divide-x" style={{ borderColor: "var(--border)" }}>
          {[
            { n: "01", k: "Remembers", v: "Tell Lethe your crypto style. It remembers across sessions, not just this chat." },
            { n: "02", k: "You own it", v: "Every memory is a Walrus blob, referenced by a Sui object you control. Verify or revoke anytime." },
            { n: "03", k: "Portable", v: "Your memory is not trapped in one app. Open another Lethe agent and it already knows you." },
          ].map((c) => (
            <div key={c.k} className="px-0 sm:px-8 py-6 sm:py-2 first:pl-0 last:pr-0" style={{ borderColor: "var(--border)" }}>
              <div className="lethe-id" style={{ color: "var(--text-dim)" }}>{c.n}</div>
              <div className="mt-2 text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>{c.k}</div>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>{c.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Colophon — set like the last page of a book ── */}
      <footer className="w-full" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-2xl mx-auto px-6 py-12 text-center flex flex-col items-center gap-4">
          <div className="lethe-id" style={{ color: "var(--text-dim)" }}>· COLOPHON ·</div>
          {/* Official marks from sui.io/media-kit + walrus.xyz media kit — do not recolor or restyle */}
          <div className="flex items-center justify-center gap-3 text-sm" style={{ color: "var(--text)" }}>
            <img src="/partners/sui-droplet.svg" alt="Sui" className="h-4 w-auto" />
            <span>Built on Sui</span>
            <span aria-hidden="true" style={{ color: "var(--text-dim)" }}>·</span>
            <img src="/partners/walrus-monogram.svg" alt="Walrus" className="h-3.5 w-auto" />
            <span>Stored on Walrus</span>
          </div>
          <p className="text-xs leading-relaxed max-w-md" style={{ color: "var(--text-dim)" }}>
            Encrypted per-user · grant-controlled on-chain. Set in Fraunces &amp; Instrument Sans;
            every on-chain id in IBM Plex Mono.
          </p>
          <div className="flex items-center gap-5 text-xs">
            <a
              className="underline decoration-dotted underline-offset-4 hover:opacity-70 transition"
              style={{ color: "var(--accent-h)" }}
              href="https://suiscan.xyz/testnet/object/0x06b5c99940b5de954b2b37cd1198f421921986eabd57b35fe3fd4cc39169ba95"
              target="_blank"
              rel="noreferrer"
            >
              the vault contract ↗
            </a>
            <a
              className="underline decoration-dotted underline-offset-4 hover:opacity-70 transition"
              style={{ color: "var(--text-dim)" }}
              href="https://github.com/vowctminibro/lethe"
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>
          </div>
          <div className="lethe-id" style={{ color: "var(--text-dim)" }}>
            LETHE — WALRUS TRACK, SUI OVERFLOW 2026
          </div>
        </div>
      </footer>
    </main>
  );
}

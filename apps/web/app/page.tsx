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

interface GrowthPhase {
  tag: string;
  live: React.ReactNode;
  unlock?: React.ReactNode;
  revenue: React.ReactNode;
  closing?: string;
  sub: string;
  footnote?: string;
  now: boolean;
}

// Block 11.5 receipts anatomy — every ring leads with what is ALREADY LIVE,
// then the single unlock left, then that ring's revenue switch. Copy locked
// by the founder; milestone sub-lines unchanged since Block 10.
const GROWTH: GrowthPhase[] = [
  {
    tag: "CORE — TODAY",
    live: (
      <>
        The whole loop — Google sign-in, memory derived from your chain, your chats, your
        ChatGPT past; Seal-encrypted, portable to Pulse, revocable by proof, exportable.{" "}
        <a href="/docs/security" className="underline decoration-dotted underline-offset-2 hover:opacity-70">
          Formally verified (19/19)
        </a>
        .
      </>
    ),
    revenue: (
      <>
        <a href="#pricing" className="underline decoration-dotted underline-offset-2 hover:opacity-70">Free</a>{" "}
        — live today.
      </>
    ),
    closing: "This ring is finished — it is the proof the others stand on.",
    sub: "Live on Sui testnet — vault birth, Seal-encrypted writes, cross-app recall, revoke, export. Formally verified (19/19).",
    now: true,
  },
  {
    tag: "PHASE 1 — THE WEDGE",
    live: <>the product crypto-natives can already use, end to end, on testnet.</>,
    unlock: (
      <>
        mainnet (Q3–Q4 2026) —{" "}
        <a href="#pricing" className="underline decoration-dotted underline-offset-2 hover:opacity-70">Pro and BYOK</a>{" "}
        switch on, and first revenue starts the Proof of Demand waterfall: WAL storage, renewals,
        the monthly burn.
      </>
    ),
    revenue: (
      <>
        <a href="#pricing" className="underline decoration-dotted underline-offset-2 hover:opacity-70">
          Pro ~$5–8/mo + BYOK
        </a>
        .
      </>
    ),
    sub: "Mainnet. Seal-gated selective sharing — share one memory, not the vault.",
    now: false,
  },
  {
    tag: "PHASE 2 — THE NETWORK",
    live: (
      <>
        <a href="/docs/sdk" className="underline decoration-dotted underline-offset-2 hover:opacity-70">the SDK</a>{" "}
        wraps the exact paths Pulse already runs in production — cross-app memory works now.
      </>
    ),
    unlock: (
      <>
        the shared-registry policy lets any app run its own decrypt sessions. “Continue with
        Lethe” kills the cold start for every Sui app.
      </>
    ),
    revenue: (
      <>
        <a href="#pricing" className="underline decoration-dotted underline-offset-2 hover:opacity-70">SDK pilots</a>.
      </>
    ),
    sub: "Shared-registry policy: third-party apps run their own decrypt sessions.",
    now: false,
  },
  {
    tag: "PHASE 3 — THE OPEN DOOR",
    live: (
      <>Google login (no wallet) and ChatGPT import — a normal person can walk in right now.</>
    ),
    unlock: (
      <>
        BYOK brings any frontier model; memory derived from usage, not just chains — the
        first Walrus write path for everyone.
      </>
    ),
    revenue: (
      <>
        <a href="#pricing" className="underline decoration-dotted underline-offset-2 hover:opacity-70">
          category-scale subscriptions
        </a>
        .
      </>
    ),
    sub: "",
    footnote: "Memory editing; MemWal adapter the day @mysten/memwal ≥0.0.4 publishes.",
    now: false,
  },
];

/** Concentric rings — core solid Coral dot, hairline Mist rings (dashed = future). */
function GrowthRings({ size = 380 }: { size?: number }) {
  const c = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" aria-hidden="true">
      <circle cx={c} cy={c} r={size * 0.18} fill="none" stroke="#5A8A9E" strokeWidth="1" strokeDasharray="3 5" opacity="0.7" />
      <circle cx={c} cy={c} r={size * 0.31} fill="none" stroke="#5A8A9E" strokeWidth="1" strokeDasharray="3 5" opacity="0.5" />
      <circle cx={c} cy={c} r={size * 0.44} fill="none" stroke="#5A8A9E" strokeWidth="1" strokeDasharray="3 5" opacity="0.35" />
      <circle cx={c} cy={c} r={7} fill="#E8B894" />
      <text x={c} y={c + 26} textAnchor="middle" fontFamily="var(--font-plex-mono), monospace" fontSize="9" letterSpacing="0.12em" fill="#5A8A9E">
        ONE VAULT
      </text>
    </svg>
  );
}


// The loop, in three frames — real product captures (DEMO_MOCK populated
// states, representative data only). The landing finally shows the product.
const FRAMES: { src: string; alt: string; caption: string }[] = [
  {
    src: "/screens/frame-chat.webp",
    alt: "Lethe chat with the memory rail",
    caption: "/chat — a fact settles into the rail, Seal-encrypted, with live Walrus and Suiscan links.",
  },
  {
    src: "/screens/frame-memory.webp",
    alt: "The /memory ownership surface",
    caption: "/memory — the ownership surface: verify on-chain, import, export, grant, revoke.",
  },
  {
    src: "/screens/frame-pulse.webp",
    alt: "Pulse reading the same memory",
    caption: "/pulse — a second app that already knows you. Revoke and it forgets — live.",
  },
];

function ProductFrames() {
  return (
    <section className="max-w-6xl mx-auto w-full px-6 lethe-section" style={{ paddingTop: 0 }}>
      <div className="lethe-eyebrow">The loop</div>
      <h2 className="lethe-section-head">The loop, in three frames</h2>
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {FRAMES.map((f, i) => (
          <figure key={f.src} className={i === 1 ? "lg:mt-10" : undefined}>
            <div
              className="rounded border overflow-hidden"
              style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-ambient)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.src} alt={f.alt} className="w-full h-auto block" loading="lazy" />
            </div>
            <figcaption className="lethe-id mt-3 leading-relaxed" style={{ color: "var(--text-dim)" }}>
              {f.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
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
        <div className="flex items-center gap-5 text-sm" style={{ color: "var(--text-dim)" }}>
          <a href="#pricing" className="hidden sm:inline hover:opacity-70 transition">Pricing</a>
          <Link href="/docs" className="hover:opacity-70 transition">Docs</Link>
          <Link href="/memory" className="hover:opacity-70 transition">Your Memory</Link>
        </div>
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

      {/* ── Three pillars — editorial margin notes, not cards (light) ── */}
      <section className="max-w-6xl mx-auto w-full px-6 lethe-section" style={{ paddingTop: "2.5rem" }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:divide-x" style={{ borderColor: "var(--border)" }}>
          {[
            { n: "01", k: "Remembers", v: "Tell Lethe your crypto style. It remembers across sessions, not just this chat." },
            { n: "02", k: "You own it", v: "Every memory is Seal-encrypted end-to-end on Walrus — even Lethe’s servers can’t read it. Decryption needs on-chain approval you control." },
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

      <ProductFrames />

      {/* ── Why Walrus needs Lethe — asymmetric editorial (NOT the grid) ── */}
      <div className="lethe-divider" aria-hidden="true" />
      <section id="why-walrus" className="max-w-6xl mx-auto w-full px-6 lethe-section">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10 md:gap-16">
          <div>
            <div className="lethe-eyebrow">The thesis</div>
            <h2 className="lethe-section-head">Why Walrus needs Lethe</h2>
          </div>
          <div>
            {[
              {
                k: "Memories renew forever",
                v: "Archives pay for storage once. Memories renew every epoch — recurring demand per user, not a one-time deal.",
              },
              {
                k: "Highest value per byte",
                v: "A memory is a few hundred bytes that knows you. People pay for identity, not gigabytes.",
              },
              {
                k: "The Web2 door is built",
                v: "Google login, no wallet, no gas — the only Walrus write path a normal person can walk through. Live today.",
              },
            ].map((c, i) => (
              <div key={c.k} className="py-6" style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <div className="text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{c.k}</div>
                <p className="mt-1.5 text-sm leading-relaxed max-w-xl" style={{ color: "var(--text-dim)" }}>{c.v}</p>
              </div>
            ))}
          </div>
        </div>
        <blockquote className="lethe-pullquote mt-14 max-w-4xl mx-auto" style={{ color: "var(--text)" }}>
          &ldquo;Remove Walrus and Lethe breaks. Ship Lethe and Walrus gets what it&rsquo;s
          missing: users who come back.&rdquo;
        </blockquote>
      </section>

      {/* ── Pricing — four true cards, principles as typographic moments ── */}
      <div className="lethe-divider" aria-hidden="true" />
      <section id="pricing" className="max-w-6xl mx-auto w-full px-6 lethe-section">
        <div className="text-center">
          <div className="lethe-eyebrow">Pricing</div>
          <h2 className="lethe-section-head">Pricing</h2>
        </div>
        <p
          className="mt-10 text-center italic mx-auto max-w-2xl"
          style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", lineHeight: 1.45, color: "var(--text)" }}
        >
          &ldquo;Your memory is free forever. We charge for the intelligence on top.&rdquo;
        </p>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              k: "Free",
              tag: "live today",
              price: null as string | null,
              v: "Full memory features forever — derive, grant, revoke, forget, export. Free models with daily limits.",
              live: true,
            },
            {
              k: "BYOK",
              tag: "coming",
              price: null as string | null,
              v: "Bring your own model keys; your memory plane stays exactly the same.",
              live: false,
            },
            {
              k: "Pro",
              tag: "planned",
              price: "~$5–8/mo",
              v: "Premium models and higher limits. The memory itself is never behind the paywall.",
              live: false,
            },
            {
              k: "SDK for apps",
              tag: "pilot pricing",
              price: null as string | null,
              v: "“Continue with Lethe” — warm-start your users with memory they already own.",
              live: false,
            },
          ].map((t) => (
            <div
              key={t.k}
              className="rounded border p-6"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg)",
                borderTopColor: t.live ? "var(--accent-h)" : "var(--border)",
                borderTopWidth: t.live ? 2 : 1,
              }}
            >
              <div className="text-2xl" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>{t.k}</div>
              <div className="lethe-id uppercase mt-1.5" style={{ color: "var(--accent-h)" }}>{t.tag}</div>
              {t.price && <div className="mt-2 text-sm" style={{ color: "var(--text)" }}>{t.price}</div>}
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>{t.v}</p>
            </div>
          ))}
        </div>
        <p
          className="mt-10 text-center italic mx-auto max-w-2xl"
          style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", lineHeight: 1.45, color: "var(--text)" }}
        >
          &ldquo;We lock you in with value, not custody — export and leave any day.&rdquo;
        </p>
      </section>

      {/* ── Proof of Demand — the page’s single DARK inverted panel ── */}
      <section className="max-w-6xl mx-auto w-full px-6 lethe-section" style={{ paddingTop: 0 }}>
        <div className="rounded px-8 py-12 md:px-14 md:py-14" style={{ background: "var(--text)", color: "var(--bg)" }}>
          <div className="lethe-eyebrow">Proof of demand</div>
          <p className="mt-4 text-base md:text-lg leading-relaxed max-w-3xl" style={{ color: "var(--bg)" }}>
            Lethe&rsquo;s unit economics are denominated in WAL and SUI by design: every user
            action is gas Lethe pays in SUI (sponsored), every memory is storage Lethe pays in
            WAL.
          </p>
          <div className="mt-8 flex flex-col md:flex-row items-stretch gap-3">
            {[
              "Revenue covers costs",
              "WAL storage & renewals for all users",
              "Monthly WAL buy-and-burn — public address",
            ].map((step, i) => (
              <div key={step} className="flex flex-col md:flex-row md:items-center gap-3 md:flex-1">
                <div
                  className="rounded border px-4 py-3 text-sm leading-snug w-full"
                  style={{ borderColor: "rgba(239,245,244,0.25)", color: "var(--bg)" }}
                >
                  {step}
                </div>
                {i < 2 && (
                  <span className="lethe-id self-center shrink-0 rotate-90 md:rotate-0" style={{ color: "var(--accent-h)" }} aria-hidden="true">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm leading-relaxed max-w-3xl" style={{ color: "rgba(239,245,244,0.7)" }}>
            Committed policy, executing from first revenue: revenue covers costs → funds WAL
            storage and renewals for all users → the remainder goes to a monthly WAL
            buy-and-burn via a public burn address — published, on-chain, verifiable by anyone.
          </p>
        </div>
      </section>

      {/* ── Growth map — three rings around one vault (same #roadmap slot) ── */}
      <section id="roadmap" className="max-w-6xl mx-auto w-full px-6 lethe-section" style={{ paddingTop: 0 }}>
        <div className="lethe-eyebrow">How this grows</div>
        <h2 className="lethe-section-head">Three rings around one vault</h2>
        <p className="mt-3 text-sm" style={{ color: "var(--text-dim)" }}>
          Most roadmaps ask you to believe. This one is mostly receipts — verify any line.
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-10 lg:gap-16 items-center">
          {/* rings — desktop only; mobile gets the small motif below */}
          <div className="hidden lg:block" aria-hidden="true">
            <GrowthRings />
          </div>
          <div className="lg:hidden mx-auto w-24" aria-hidden="true">
            <GrowthRings size={96} />
          </div>

          <div>
            {GROWTH.map((g, i) => (
              <div key={g.tag} className="py-6" style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <div className="lethe-id uppercase" style={{ color: g.now ? "var(--accent-h)" : "var(--text-dim)" }}>
                  {g.tag}
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-x-4 gap-y-2.5">
                  <span className="lethe-id uppercase pt-0.5" style={{ color: "var(--accent-h)" }}>Live today</span>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{g.live}</p>
                  {g.unlock && (
                    <>
                      <span className="lethe-id uppercase pt-0.5" style={{ color: "#5A8A9E" }}>One unlock away</span>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{g.unlock}</p>
                    </>
                  )}
                  <span className="lethe-id uppercase pt-0.5" style={{ color: "#5A8A9E" }}>Revenue</span>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{g.revenue}</p>
                </div>
                {g.closing && (
                  <p className="mt-2.5 text-sm italic" style={{ color: "var(--text-dim)" }}>{g.closing}</p>
                )}
                {g.sub && (
                  <p className="lethe-id mt-3 leading-relaxed" style={{ color: "var(--text-dim)" }}>{g.sub}</p>
                )}
                {g.footnote && (
                  <p className="lethe-id mt-3 leading-relaxed" style={{ color: "var(--text-dim)", opacity: 0.8 }}>{g.footnote}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <p
          className="mt-12 text-center italic mx-auto max-w-2xl"
          style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", lineHeight: 1.45, color: "var(--text)" }}
        >
          The inner ring is the biggest one — and it already shipped, solo. The rings
          ahead are smaller.
        </p>
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
              href="https://suiscan.xyz/testnet/object/0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c"
              target="_blank"
              rel="noreferrer"
            >
              the vault contract ↗
            </a>
            <Link
              className="underline decoration-dotted underline-offset-4 hover:opacity-70 transition"
              style={{ color: "var(--text-dim)" }}
              href="/docs"
            >
              docs
            </Link>
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

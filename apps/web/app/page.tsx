import Link from "next/link";
import { Logo } from "@/src/components/Logo";
import { HeroCTA } from "@/src/components/HeroCTA";
import { RevealOnScroll } from "@/src/components/RevealOnScroll";

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
  stable?: string;
  horizon?: string;
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
        The whole loop, shipped — derive, encrypt, recall, revoke, export.{" "}
        <a href="/docs/security" className="lethe-link">
          Formally verified (19/19)
        </a>
        .
      </>
    ),
    revenue: (
      <>
        <a href="#pricing" className="lethe-link">Free</a>{" "}
        — live today.
      </>
    ),
    closing: "This ring is finished — it is the proof the others stand on.",
    sub: "Live on Sui testnet — vault birth, Seal-encrypted writes, cross-app recall, revoke, export. Formally verified (19/19).",
    now: true,
  },
  {
    tag: "PHASE 1 — THE WEDGE",
    live: <>The product crypto-natives can use end to end, on testnet today.</>,
    unlock: (
      <>
        Mainnet (Q3–Q4 2026) —{" "}
        <a href="#pricing" className="lethe-link">Pro</a>{" "}
        switches on and starts funding WAL storage and renewals.
      </>
    ),
    revenue: (
      <>
        <a href="#pricing" className="lethe-link">
          Pro — $9/mo
        </a>
        .
      </>
    ),
    sub: "Mainnet. Seal-gated selective sharing — share one memory, not the vault.",
    stable: "Pay for Pro in stablecoins — USDC, no card.",
    now: false,
  },
  {
    tag: "PHASE 2 — THE NETWORK",
    live: (
      <>
        <a href="/docs/sdk" className="lethe-link">The SDK</a>{" "}
        wraps the paths Pulse runs in production — cross-app memory works now.
      </>
    ),
    unlock: <>A shared-registry policy lets any Sui app run its own decrypt sessions.</>,
    revenue: (
      <>
        <a href="#pricing" className="lethe-link">SDK pilots</a>.
      </>
    ),
    sub: "Shared-registry policy: third-party apps run their own decrypt sessions.",
    horizon:
      "On the horizon: memory other Sui contracts can read — a lending market that honors your no-leverage history, on-chain. Impossible without the object model.",
    now: false,
  },
  {
    tag: "PHASE 3 — THE OPEN DOOR",
    live: <>Google login and ChatGPT import — a normal person walks in today.</>,
    unlock: <>BYOK brings any frontier model; memory from usage, not just chains.</>,
    revenue: (
      <>
        <a href="#pricing" className="lethe-link">
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

/**
 * The growth map AS the visual — four concentric bands carry the four phases:
 * CORE (shipped, solid Coral) → WEDGE → NETWORK → OPEN DOOR (roadmap, hairline
 * Mist, fainter outward). Each band is labeled on its top arc (Fog-masked so the
 * ring reads behind it). Inner = shipped, outer = roadmap — structure is the
 * information. Detailed phase text sits beside it as support.
 */
// Block 16: stronger band contrast (was too faint), CORE in deep coral
// (--accent-strong) so "shipped = solid coral" is unmistakable, Ink labels.
const RING_BANDS = [
  { key: "CORE", r: 0.14, op: 1, core: true },
  { key: "WEDGE", r: 0.27, op: 0.85, core: false },
  { key: "NETWORK", r: 0.39, op: 0.62, core: false },
  { key: "OPEN DOOR", r: 0.48, op: 0.42, core: false },
];
const INK = "#1A3A4A";
const ACCENT_STRONG = "#C85A2E";
function GrowthRings({ size = 360, labeled = true }: { size?: number; labeled?: boolean }) {
  const c = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" aria-hidden="true">
      {RING_BANDS.map((b) => (
        <circle
          key={b.key}
          cx={c}
          cy={c}
          r={size * b.r}
          fill="none"
          stroke={b.core ? ACCENT_STRONG : "#5A8A9E"}
          strokeWidth={b.core ? 2.25 : 1.25}
          strokeDasharray={b.core ? undefined : "3 5"}
          opacity={b.op}
        />
      ))}
      <circle cx={c} cy={c} r={7} fill={ACCENT_STRONG} />
      <text x={c} y={c + 24} textAnchor="middle" fontFamily="var(--font-plex-mono), monospace" fontSize="10" fontWeight="500" letterSpacing="0.12em" fill={INK}>
        ONE VAULT
      </text>
      {labeled &&
        RING_BANDS.map((b) => {
          const ly = c - size * b.r;
          const w = b.key.length * 7.6 + 14;
          return (
            <g key={`lbl-${b.key}`}>
              <rect x={c - w / 2} y={ly - 9} width={w} height={17} fill="#EFF5F4" />
              <text
                x={c}
                y={ly + 3}
                textAnchor="middle"
                fontFamily="var(--font-plex-mono), monospace"
                fontSize="11"
                fontWeight="500"
                letterSpacing="0.1em"
                fill={b.core ? ACCENT_STRONG : INK}
              >
                {b.key}
              </text>
            </g>
          );
        })}
    </svg>
  );
}


// The loop, in three frames — real product captures (DEMO_MOCK populated
// states, representative data only). Stacked large + vertical so the UI text
// inside is legible, with hairline annotation callouts on the key moment.
type Callout = { label: string; x: number; y: number; dir: "l" | "r" };
const FRAMES: { src: string; alt: string; caption: string; callouts: Callout[] }[] = [
  {
    src: "/screens/frame-chat.webp",
    alt: "Lethe chat with the memory rail",
    caption: "/chat — a fact settles into the rail, Seal-encrypted, with live Walrus and Suiscan links.",
    callouts: [
      { label: "the fact settles here", x: 75, y: 19, dir: "l" },
      { label: "model — switch mid-chat", x: 72, y: 6, dir: "l" },
    ],
  },
  {
    src: "/screens/frame-memory.webp",
    alt: "The /memory ownership surface",
    caption: "/memory — the ownership surface: verify on-chain, import, export, grant, revoke.",
    callouts: [
      { label: "import / export", x: 63, y: 86, dir: "l" },
      { label: "verify on Suiscan ↗", x: 49, y: 94, dir: "r" },
    ],
  },
  {
    src: "/screens/frame-pulse.webp",
    alt: "Pulse reading the same memory",
    caption: "/pulse — a second app that already knows you. Revoke and it forgets — live.",
    callouts: [
      { label: "a second app, your grant", x: 50, y: 30, dir: "r" },
      { label: "revoke → it forgets", x: 50, y: 91, dir: "r" },
    ],
  },
];

/** One annotation: anchor dot at (x,y) over the frame, short leader line, mono
 *  Coral tag. Desktop only — on mobile the labels drop to a list under the frame. */
function FrameCallout({ label, x, y, dir }: Callout) {
  const toLeft = dir === "l";
  const dot = <span style={{ width: 7, height: 7, borderRadius: 9999, background: "var(--accent-h)", flexShrink: 0 }} />;
  const line = <span style={{ width: 26, height: 1, background: "var(--accent-h)", flexShrink: 0 }} />;
  const tag = (
    <span
      className="lethe-id uppercase whitespace-nowrap rounded px-2 py-1"
      style={{ color: "var(--accent-h)", background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-ambient)" }}
    >
      {label}
    </span>
  );
  return (
    <div
      className="absolute z-10 hidden md:flex items-center gap-1.5 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: `translate(${toLeft ? "-100%" : "0"}, -50%)` }}
    >
      {toLeft ? (<>{tag}{line}{dot}</>) : (<>{dot}{line}{tag}</>)}
    </div>
  );
}

function ProductFrames() {
  return (
    <section className="max-w-6xl mx-auto w-full px-6 lethe-section" style={{ paddingTop: 0 }}>
      <div className="lethe-eyebrow">The loop</div>
      <h2 className="lethe-section-head">The loop, in three frames</h2>
      <div className="mt-12 space-y-16 lg:space-y-24">
        {FRAMES.map((f, i) => {
          const frameRight = i % 2 === 1;
          return (
            <figure
              key={f.src}
              className="lethe-rise grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center"
              data-reveal
              data-reveal-delay={i * 90}
            >
              <div className={`relative lg:col-span-8 ${frameRight ? "lg:order-2" : ""}`}>
                <div
                  className="rounded border overflow-hidden"
                  style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-ambient)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.src} alt={f.alt} className="w-full h-auto block" loading="lazy" />
                </div>
                {f.callouts.map((c) => (
                  <FrameCallout key={c.label} {...c} />
                ))}
              </div>
              <div className={`lg:col-span-4 ${frameRight ? "lg:order-1" : ""}`}>
                <figcaption className="lethe-body lethe-measure" style={{ color: "var(--text)" }}>
                  {f.caption}
                </figcaption>
                {/* mobile fallback: callouts as labels under the frame */}
                <ul className="md:hidden mt-3 space-y-1">
                  {f.callouts.map((c) => (
                    <li key={c.label} className="lethe-id uppercase" style={{ color: "var(--accent-h)" }}>
                      → {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Pricing tier glyphs — hairline, brand-stroke, monogram-style (NOT third-party
 * logos, not clip-art): a spark (Free), a key (BYOK), a ring echoing the growth
 * map (Pro), code brackets (SDK). Color is inherited from the card (Coral on the
 * live tier, Mist otherwise).
 */
const PRICING_GLYPHS = {
  spark: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 C12.5 8.5 15.5 11.5 21 12 C15.5 12.5 12.5 15.5 12 21 C11.5 15.5 8.5 12.5 3 12 C8.5 11.5 11.5 8.5 12 3 Z" />
    </svg>
  ),
  key: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="4.5" />
      <path d="M11 11 L20 20" />
      <path d="M17 17 L19.5 14.5" />
    </svg>
  ),
  ring: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ),
  bracket: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6 L4 12 L9 18" />
      <path d="M15 6 L20 12 L15 18" />
    </svg>
  ),
  // ascending bars — "more quota" (Premium)
  bars: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19 L5 14" />
      <path d="M12 19 L12 9" />
      <path d="M19 19 L19 5" />
    </svg>
  ),
};

/**
 * "Built on" — the load-bearing Mysten stack Lethe genuinely uses (honest: no
 * payment/partner logos it doesn't). All four carry their real marks: Sui's
 * droplet, Walrus's W, and the Seal mascot + Enoki monogram extracted from the
 * official logos onto transparent backgrounds (their opaque brand cards would
 * read as boxes here). Every mark is grayscaled to the Fog palette so no brand
 * color shouts and all four read as one set. Each links to the artifact it
 * represents.
 */
const BUILT_ON: { name: string; mark: string | null; href: string }[] = [
  { name: "Sui", mark: "/partners/sui-droplet.svg", href: "https://sui.io" },
  { name: "Walrus", mark: "/partners/walrus-monogram.svg", href: "https://www.walrus.xyz" },
  { name: "Seal", mark: "/partners/seal.png", href: "https://seal.mystenlabs.com" },
  { name: "Enoki", mark: "/partners/enoki.png", href: "https://docs.enoki.mystenlabs.com" },
];

function BuiltOnStrip() {
  return (
    <section className="max-w-4xl mx-auto w-full px-6 pt-10 pb-2 lethe-rise" data-reveal>
      <div className="lethe-eyebrow text-center">Built on</div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {BUILT_ON.flatMap((it, i) => {
          const inner = (
            <>
              {it.mark && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.mark} alt="" aria-hidden="true" className="h-4 w-auto" style={{ filter: "grayscale(1)", opacity: 0.8 }} />
              )}
              <span className="lethe-id uppercase" style={{ color: "var(--text)" }}>{it.name}</span>
            </>
          );
          const cls = "inline-flex items-center gap-2 transition hover:opacity-70";
          const link = it.href.startsWith("http") ? (
            <a key={it.name} href={it.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
          ) : (
            <Link key={it.name} href={it.href} className={cls}>{inner}</Link>
          );
          const sep = (
            <span key={`sep-${i}`} aria-hidden="true" className="hidden sm:block h-3.5 w-px" style={{ background: "var(--border)" }} />
          );
          return i === 0 ? [link] : [sep, link];
        })}
      </div>

      {/* Credibility line — every claim links to its own proof. */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 lethe-id uppercase" style={{ color: "var(--text-dim)" }}>
        <a href="https://github.com/vowctminibro/lethe" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition" style={{ color: "var(--accent-strong)" }}>
          Open source
        </a>
        <span aria-hidden="true">·</span>
        <a href="https://suiscan.xyz/testnet/object/0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition" style={{ color: "var(--accent-strong)" }}>
          Verifiable on-chain
        </a>
        <span aria-hidden="true">·</span>
        <Link href="/docs/security" className="hover:opacity-70 transition" style={{ color: "var(--accent-strong)" }}>
          Formally verified · Sui Prover 19/19
        </Link>
      </div>
    </section>
  );
}

/**
 * Within-Lethe plan matrix (Venice "Compare Features" pattern). Three consumer
 * tiers only — the developer SDK lives in its own callout below, not as a column.
 * Truthful capabilities: Free is live today; paid tiers are honestly "planned"
 * (the cards' tags + Coming-soon CTAs carry that, plus the "in preview" caption).
 * Pro is the recommended tier and carries the Coral accent + "Recommended" tag.
 * Scrolls in its own box on mobile, never the page.
 */
const PLAN_COLS: { name: string; price: string; tag?: string }[] = [
  { name: "Free", price: "$0" },
  { name: "Pro", price: "$9/mo", tag: "Recommended" },
  { name: "Premium", price: "$19/mo" },
];
const PLAN_PRO_IDX = 1;
const PLAN_GROUPS: { group: string; rows: { label: string; cells: string[] }[] }[] = [
  {
    group: "Memory",
    rows: [
      { label: "Memories stored", cells: ["100", "Unlimited", "Unlimited"] },
      { label: "Recall history", cells: ["30 days", "Unlimited", "Unlimited"] },
      { label: "Derive · recall", cells: ["✓", "✓", "✓"] },
      { label: "Verifiable export", cells: ["—", "✓", "✓"] },
    ],
  },
  {
    group: "Agents & portability",
    rows: [
      { label: "Connected agents", cells: ["1", "10", "Unlimited"] },
      { label: "Grant / revoke on-chain", cells: ["✓", "✓", "✓"] },
      { label: "Portable across apps", cells: ["✓", "✓", "✓"] },
    ],
  },
  {
    group: "Privacy",
    rows: [
      { label: "Seal end-to-end encryption", cells: ["✓", "✓", "✓"] },
      { label: "Formally verified (19/19)", cells: ["✓", "✓", "✓"] },
    ],
  },
  {
    group: "Models",
    rows: [
      { label: "Free models · daily limits", cells: ["✓", "✓", "✓"] },
      { label: "Switch model mid-chat", cells: ["✓", "✓", "✓"] },
      { label: "Premium models", cells: ["—", "Add-on", "✓"] },
      { label: "Bring your own keys", cells: ["—", "✓", "✓"] },
      { label: "Early access", cells: ["—", "—", "✓"] },
    ],
  },
];

function PlanCell({ v, isPro }: { v: string; isPro: boolean }) {
  if (v === "✓") return <span style={{ color: isPro ? "var(--accent-strong)" : "var(--text)" }}>✓</span>;
  if (v === "—") return <span style={{ color: "var(--text-dim)", opacity: 0.6 }}>—</span>;
  return <span style={{ color: "var(--text)" }}>{v}</span>;
}

function PlanCompare() {
  const CORAL_BG = "rgba(232, 184, 148, 0.08)";
  return (
    <div className="mt-14">
      <div className="lethe-eyebrow text-center">Compare features</div>
      <p className="mt-2 text-center lethe-id uppercase" style={{ color: "var(--text-dim)" }}>
        Pricing in preview · validating with early users
      </p>
      <div className="mt-6 overflow-x-auto lethe-rise" data-reveal>
        <table className="w-full border-collapse" style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th className="text-left p-3" />
              {PLAN_COLS.map((c, i) => {
                const pro = i === PLAN_PRO_IDX;
                return (
                  <th
                    key={c.name}
                    className="text-center p-3 align-bottom"
                    style={{
                      color: pro ? "var(--accent-strong)" : "var(--text)",
                      background: pro ? CORAL_BG : "transparent",
                      borderTop: pro ? "2px solid var(--accent-strong)" : "none",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {c.tag && (
                      <div className="lethe-id uppercase" style={{ color: "var(--accent-strong)" }}>{c.tag}</div>
                    )}
                    <div className="lethe-id uppercase mt-1">{c.name}</div>
                    <div className="text-base mt-0.5" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{c.price}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PLAN_GROUPS.flatMap((g) => [
              <tr key={`g-${g.group}`}>
                <td className="lethe-id uppercase pt-6 pb-2 px-3" style={{ color: "var(--accent-h)" }}>{g.group}</td>
                {PLAN_COLS.map((c, i) => (
                  <td key={`${g.group}-${c.name}`} style={{ background: i === PLAN_PRO_IDX ? CORAL_BG : "transparent" }} />
                ))}
              </tr>,
              ...g.rows.map((r) => (
                <tr key={r.label}>
                  <th
                    scope="row"
                    className="text-left p-3 lethe-body"
                    style={{ fontWeight: 500, color: "var(--text)", borderBottom: "1px solid var(--border)" }}
                  >
                    {r.label}
                  </th>
                  {r.cells.map((v, i) => (
                    <td
                      key={i}
                      className="text-center p-3 lethe-body"
                      style={{ background: i === PLAN_PRO_IDX ? CORAL_BG : "transparent", borderBottom: "1px solid var(--border)" }}
                    >
                      <PlanCell v={v} isPro={i === PLAN_PRO_IDX} />
                    </td>
                  ))}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Developer SDK — its own callout, not a consumer column. "Continue with Lethe"
 * lets any app embed verifiable, user-owned memory; priced per memory operation.
 */
function SdkCallout() {
  const FEATURES = [
    "Derive · recall · export",
    "Grant · revoke",
    "Portable across apps",
    "Seal end-to-end encryption",
    "Formally verified (19/19)",
    "Continue with Lethe handoff",
  ];
  return (
    <div
      className="mt-14 rounded border p-6 md:p-8 lethe-rise"
      data-reveal
      style={{ borderColor: "var(--border)", background: "var(--bg)" }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0" style={{ color: "var(--accent-strong)" }} aria-hidden="true">
          {PRICING_GLYPHS.bracket}
        </div>
        <div className="flex-1">
          <div className="lethe-id uppercase" style={{ color: "var(--accent-h)" }}>Build on Lethe — for developers</div>
          <p className="mt-2 lethe-body" style={{ color: "var(--text)" }}>
            Embed verifiable, user-owned memory in your own agent or app. Grant/revoke on-chain,
            Seal-encrypted, formally verified.
          </p>
          <p className="mt-2 lethe-body" style={{ color: "var(--accent-strong)", fontWeight: 600 }}>
            Usage-based · pay per memory operation
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2 lethe-id uppercase" style={{ color: "var(--text-dim)" }}>
            {FEATURES.flatMap((f, i) => [
              ...(i > 0 ? [<li key={`sep-${i}`} aria-hidden="true">·</li>] : []),
              <li key={f}>{f}</li>,
            ])}
          </ul>
          <Link
            href="/docs/sdk"
            className="mt-6 inline-flex items-center justify-center rounded border px-4 py-2.5 lethe-id uppercase transition hover:opacity-80"
            style={{ borderColor: "var(--accent-strong)", color: "var(--accent-strong)" }}
          >
            Read the docs →
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * "How Lethe is different" — a compact, factual comparison. Only defensible,
 * non-disparaging cells (per the honesty rule). Coral accent marks the Lethe
 * column; the table scrolls inside its own box on mobile (never the page).
 */
const COMPARE: { cols: string[]; rows: { axis: string; cells: string[] }[] } = {
  cols: ["ChatGPT memory", "Mem0", "Lethe"],
  rows: [
    { axis: "Who owns the memory", cells: ["The app", "The app", "You — an on-chain object"] },
    { axis: "Privacy", cells: ["Policy", "Policy", "Cryptographic (Seal)"] },
    { axis: "Portable across apps", cells: ["No", "SDK (vendor cloud)", "Yes — grant/revoke on-chain"] },
    { axis: "Leave with your data", cells: ["Limited", "Export", "Export, one click"] },
    { axis: "Model lock-in", cells: ["Tied to the platform", "Vendor cloud", "Switch models, memory follows"] },
  ],
};

function ComparisonTable() {
  const CORAL_BG = "rgba(232, 184, 148, 0.08)";
  return (
    <section className="max-w-5xl mx-auto w-full px-6 lethe-section" style={{ paddingTop: 0 }}>
      <div className="lethe-eyebrow">How this compares</div>
      <h2 className="lethe-section-head">How Lethe is different</h2>
      <div className="mt-8 overflow-x-auto lethe-rise" data-reveal>
        <table className="w-full border-collapse" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th className="text-left align-bottom p-4" />
              {COMPARE.cols.map((c) => {
                const isLethe = c === "Lethe";
                return (
                  <th
                    key={c}
                    className="lethe-id uppercase text-left align-bottom p-4"
                    style={{
                      color: isLethe ? "var(--accent-strong)" : "var(--text)",
                      background: isLethe ? CORAL_BG : "transparent",
                      borderTop: isLethe ? "2px solid var(--accent-strong)" : "none",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {c}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {COMPARE.rows.map((r) => (
              <tr key={r.axis}>
                <th
                  scope="row"
                  className="text-left p-4 lethe-body"
                  style={{ fontWeight: 600, color: "var(--text)", borderBottom: "1px solid var(--border)" }}
                >
                  {r.axis}
                </th>
                {r.cells.map((cell, ci) => {
                  const isLethe = ci === r.cells.length - 1;
                  return (
                    <td
                      key={ci}
                      className="p-4 lethe-body align-top"
                      style={{
                        color: "var(--text)",
                        background: isLethe ? CORAL_BG : "transparent",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Stat bar — a ROW of small honest proof points (NOT one giant number; the
 * big-number-with-label is the template answer). Mono micro-labels, hairline
 * strip, quiet. 19/19 links to the security page. No invented metrics.
 */
const STATS: { label: string; href: string | null }[] = [
  { label: "19/19 formally verified", href: "/docs/security" },
  { label: "Seal end-to-end encrypted", href: null },
  { label: "4 Mysten primitives, load-bearing", href: null },
  { label: "live on Sui testnet", href: null },
];
function StatBar() {
  return (
    <section className="max-w-6xl mx-auto w-full px-6 mt-6 lethe-rise" data-reveal>
      <div
        className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 py-4"
        style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        {STATS.flatMap((s, i) => {
          const label = (
            <span className="lethe-id uppercase" style={{ color: s.href ? "var(--accent-strong)" : "var(--text)" }}>
              {s.label}
            </span>
          );
          const node = s.href ? (
            <Link key={s.label} href={s.href} className="transition hover:opacity-70">{label}</Link>
          ) : (
            <span key={s.label}>{label}</span>
          );
          const sep = (
            <span key={`sep-${i}`} aria-hidden="true" className="hidden sm:block h-3 w-px" style={{ background: "var(--border)" }} />
          );
          return i === 0 ? [node] : [sep, node];
        })}
      </div>
    </section>
  );
}

/**
 * Demand loop — the economics flywheel as a 4-node cycle (NOT a waterfall):
 * use → Walrus blob → recurring renewal demand → revenue → back to use.
 * Lives inside the dark Proof-of-Demand panel, so colors are the inverted set
 * (Fog text on Ink, Coral accents, light hairlines). Hairline/monogram only —
 * no emoji, no clip-art. Desktop = horizontal loop; mobile = vertical stack.
 */
const LOOP_GLYPHS = {
  chat: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5 h16 v10 h-9 l-4 3 v-3 H4 Z" />
      <path d="M8 9 h8 M8 12 h5" />
    </svg>
  ),
  store: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="6" rx="7" ry="2.5" />
      <path d="M5 6 v12 c0 1.4 3.1 2.5 7 2.5 s7 -1.1 7 -2.5 V6" />
      <path d="M5 12 c0 1.4 3.1 2.5 7 2.5 s7 -1.1 7 -2.5" />
    </svg>
  ),
  renew: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12 a8 8 0 1 1 -2.4 -5.7" />
      <path d="M20 3.5 V7 h-3.5" />
    </svg>
  ),
  revenue: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7 V17 M9.5 9.5 h3.2 a1.6 1.6 0 0 1 0 3.2 H10 a1.6 1.6 0 0 0 0 3.2 h3.5" />
    </svg>
  ),
};

function DemandLoop() {
  const HAIR = "rgba(239,245,244,0.22)";
  const NODES = [
    { n: "01", glyph: LOOP_GLYPHS.chat, k: "User chats & remembers", sub: null as string | null },
    { n: "02", glyph: LOOP_GLYPHS.store, k: "Memory = Walrus blob", sub: "WAL · sponsored gas on Sui" },
    { n: "03", glyph: LOOP_GLYPHS.renew, k: "Renews every epoch", sub: "recurring WAL demand" },
    { n: "04", glyph: LOOP_GLYPHS.revenue, k: "Revenue covers cost", sub: "+ funds renewals" },
  ];
  return (
    <div className="mt-10" aria-hidden="true">
      {/* nodes — horizontal loop on desktop, vertical stack on mobile */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-2">
        {NODES.map((nd, i) => (
          <div key={nd.n} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-2 md:flex-1">
            <div
              className="rounded border p-4 w-full md:flex-1 flex items-center md:flex-col md:text-center gap-3 md:gap-2"
              style={{ borderColor: HAIR }}
            >
              <span className="shrink-0" style={{ color: "var(--accent-h)" }}>{nd.glyph}</span>
              <span>
                <span className="lethe-id block" style={{ color: "var(--accent-h)" }}>{nd.n}</span>
                <span className="lethe-body block" style={{ color: "var(--bg)" }}>{nd.k}</span>
                {nd.sub && (
                  <span className="lethe-id block mt-1" style={{ color: "rgba(239,245,244,0.55)" }}>{nd.sub}</span>
                )}
              </span>
            </div>
            {i < 3 && (
              <span className="self-center shrink-0 rotate-90 md:rotate-0 lethe-id" style={{ color: "var(--accent-strong)" }}>
                →
              </span>
            )}
          </div>
        ))}
      </div>

      {/* loop-back band — closes 04 → 01, the recurring flywheel */}
      <div className="mt-3 flex items-center gap-3">
        <span className="shrink-0 text-lg leading-none" style={{ color: "var(--accent-strong)" }}>↺</span>
        <span className="flex-1 border-t border-dashed" style={{ borderColor: "var(--accent-strong)", opacity: 0.5 }} />
        <span className="lethe-id text-center" style={{ color: "var(--accent-h)" }}>loops back — recurring, every user, every epoch</span>
        <span className="flex-1 border-t border-dashed" style={{ borderColor: "var(--accent-strong)", opacity: 0.5 }} />
        <span className="shrink-0 text-lg leading-none" style={{ color: "var(--accent-strong)" }}>↺</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <RevealOnScroll />
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
          <div className="relative lethe-rise" data-reveal>
            <h1 className="lethe-display" style={{ color: "var(--text)" }}>
              Named after the river
              <br />
              of forgetting.
              <br />
              <span style={{ fontStyle: "normal", fontWeight: 500 }}>Built so nothing is.</span>
            </h1>

            <p className="mt-8 text-base max-w-md leading-relaxed" style={{ color: "var(--text)", fontWeight: 450 }}>
              User-owned memory for AI agents — stored on Walrus, anchored on Sui, portable
              across apps.
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

      {/* ── Built on — the real Mysten stack, just below the hero ── */}
      <BuiltOnStrip />

      {/* ── Stat bar — a row of small honest proof points ── */}
      <StatBar />

      {/* ── Section divider — water line-work ── */}
      <div className="lethe-divider" aria-hidden="true" />

      {/* ── Three pillars — editorial margin notes, not cards (light) ── */}
      <section className="max-w-6xl mx-auto w-full px-6 lethe-section" style={{ paddingTop: "2.5rem" }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:divide-x" style={{ borderColor: "var(--border)" }}>
          {[
            { n: "01", k: "Remembers", v: "Tell Lethe your crypto style. It remembers across sessions, not just this chat." },
            { n: "02", k: "You own it", v: "Every memory is Seal-encrypted end-to-end on Walrus — even Lethe’s servers can’t read it. Decryption needs on-chain approval you control." },
            { n: "03", k: "Portable", v: "Your memory is not trapped in one app. Open another Lethe agent and it already knows you." },
          ].map((c, i) => (
            <div
              key={c.k}
              className="px-0 sm:px-8 py-6 sm:py-2 first:pl-0 last:pr-0 lethe-rise"
              style={{ borderColor: "var(--border)" }}
              data-reveal
              data-reveal-delay={i * 80}
            >
              <div className="lethe-id" style={{ color: "var(--text-dim)" }}>{c.n}</div>
              <div className="mt-2 text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>{c.k}</div>
              <p className="mt-2 lethe-body" style={{ color: "var(--text)" }}>{c.v}</p>
            </div>
          ))}
        </div>
      </section>

      <ProductFrames />

      {/* ── Why Walrus needs Lethe — asymmetric editorial (NOT the grid) ── */}
      <section id="why-walrus" className="max-w-6xl mx-auto w-full px-6 lethe-section" style={{ paddingTop: 0 }}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10 md:gap-16 lethe-rise" data-reveal>
          <div>
            <div className="lethe-eyebrow">The thesis</div>
            <h2 className="lethe-section-head">Why Walrus needs Lethe</h2>
          </div>
          <div>
            {[
              {
                k: "Memories renew, archives don't",
                v: "Archives pay once; a memory layer is designed to renew every epoch — recurring WAL demand per user.",
              },
              {
                k: "Highest value per byte",
                v: "A few hundred bytes that know you — people pay for identity, not gigabytes.",
              },
              {
                k: "The Web2 door is built",
                v: "Google login, no wallet, no gas — the only Walrus write path a normal person can walk through.",
              },
            ].map((c, i) => (
              <div key={c.k} className="py-6" style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <div className="text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>{c.k}</div>
                <p className="mt-1.5 lethe-body lethe-measure" style={{ color: "var(--text)" }}>{c.v}</p>
              </div>
            ))}
            <p
              className="py-6 lethe-body lethe-measure"
              style={{ borderTop: "1px solid var(--border)", color: "var(--text)" }}
            >
              And because every memory is a Sui object, Lethe is a primitive other apps — and
              other contracts — build on. Demand compounds across the ecosystem, not inside one
              app.
            </p>
          </div>
        </div>
        <blockquote className="lethe-pullquote mt-14 max-w-4xl mx-auto lethe-rise" data-reveal style={{ color: "var(--text)" }}>
          &ldquo;Remove Walrus and Lethe breaks. Ship Lethe and Walrus gets what it&rsquo;s
          missing: users who come back.&rdquo;
        </blockquote>
      </section>

      {/* ── Pricing — four true cards, principles as typographic moments ── */}
      <section id="pricing" className="max-w-6xl mx-auto w-full px-6 lethe-section" style={{ paddingTop: 0 }}>
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
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {[
            {
              k: "Free",
              tag: "live today",
              price: "$0",
              v: "Memory features, free models, daily limits.",
              credit: null as string | null,
              byok: null as string | null,
              recommended: false,
              live: true,
              glyph: PRICING_GLYPHS.spark,
              cta: { label: "Start free", href: "/chat", disabled: false },
            },
            {
              k: "Pro",
              tag: "planned",
              price: "$9/mo",
              v: "Premium models, higher limits, unlimited memory.",
              credit: null as string | null,
              byok: "Bring your own model keys — your memory plane stays the same.",
              recommended: true,
              live: false,
              glyph: PRICING_GLYPHS.ring,
              cta: { label: "Coming soon", href: "", disabled: true },
            },
            {
              k: "Premium",
              tag: "planned",
              price: "$19/mo",
              v: "Everything in Pro, premium models included, early access.",
              credit: null as string | null,
              byok: null as string | null,
              recommended: false,
              live: false,
              glyph: PRICING_GLYPHS.bars,
              cta: { label: "Coming soon", href: "", disabled: true },
            },
          ].map((t, i) => (
            <div
              key={t.k}
              className="rounded border p-6 lethe-rise flex flex-col h-full"
              style={{
                borderColor: t.recommended ? "var(--accent-h)" : "var(--border)",
                background: t.recommended ? "rgba(232, 184, 148, 0.06)" : "var(--bg)",
                borderTopColor: t.live || t.recommended ? "var(--accent-h)" : "var(--border)",
                borderTopWidth: t.live || t.recommended ? 2 : 1,
              }}
              data-reveal
              data-reveal-delay={i * 70}
            >
              {/* quiet emphasis — a recommendation eyebrow, not a loud badge */}
              <div className="lethe-id uppercase" style={{ color: "var(--accent-strong)", minHeight: "1rem" }}>
                {t.recommended ? "Recommended" : ""}
              </div>
              <div className="mt-2" style={{ color: t.live || t.recommended ? "var(--accent-strong)" : "var(--text-dim)" }} aria-hidden="true">
                {t.glyph}
              </div>
              <div className="mt-3 text-2xl" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>{t.k}</div>
              <div className="mt-1.5 text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--accent-strong)" }}>
                {t.price}
              </div>
              <div className="lethe-id uppercase mt-1.5" style={{ color: "var(--accent-h)" }}>{t.tag}</div>
              {t.credit && (
                <p className="mt-2 lethe-body" style={{ color: "var(--text)" }}>{t.credit}</p>
              )}
              <p className="mt-3 lethe-body" style={{ color: "var(--text)" }}>{t.v}</p>
              {t.byok && (
                <p className="mt-2 text-[0.82rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>{t.byok}</p>
              )}
              <div className="flex-1" />
              {t.cta.disabled ? (
                <span
                  className="mt-6 w-full inline-flex items-center justify-center rounded border px-4 py-2.5 lethe-id uppercase cursor-not-allowed select-none"
                  style={{ borderColor: "var(--border)", color: "var(--text-dim)", opacity: 0.55 }}
                  aria-disabled="true"
                >
                  {t.cta.label}
                </span>
              ) : (
                <Link
                  href={t.cta.href}
                  className="mt-6 w-full inline-flex items-center justify-center rounded border px-4 py-2.5 lethe-id uppercase transition hover:opacity-80"
                  style={{ borderColor: "var(--accent-strong)", background: "var(--accent-strong)", color: "var(--bg)" }}
                >
                  {t.cta.label}
                </Link>
              )}
            </div>
          ))}
        </div>
        <p
          className="mt-10 text-center italic mx-auto max-w-2xl"
          style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", lineHeight: 1.45, color: "var(--text)" }}
        >
          &ldquo;We lock you in with value, not custody — export and leave any day.&rdquo;
        </p>

        {/* within-Lethe plan matrix */}
        <PlanCompare />

        {/* developer SDK — separate callout, not a consumer tier */}
        <SdkCallout />

        {/* model-future line — models come and go; the memory is permanent */}
        <p className="mt-8 text-center lethe-body mx-auto max-w-2xl" style={{ color: "var(--text-muted)" }}>
          More models as they ship — your memory works with all of them.
        </p>
      </section>

      {/* ── How Lethe is different — factual comparison ── */}
      <ComparisonTable />

      {/* ── Own it — condensed positioning (Portability + on-chain) ── */}
      <section className="max-w-5xl mx-auto w-full px-6 lethe-section" style={{ paddingTop: 0 }}>
        <div className="lethe-eyebrow">Why on-chain</div>
        <h2 className="lethe-section-head">Memory you own, not memory an app stores</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 lethe-rise" data-reveal>
          <div>
            <div className="text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>Portable by grant</div>
            <p className="mt-1.5 lethe-body lethe-measure" style={{ color: "var(--text)" }}>
              Your memory is a Sui object, and access is a grant you issue to an agent&rsquo;s address —
              and revoke the same way, on-chain and verifiable. It doesn&rsquo;t live in any one app&rsquo;s
              database, so it isn&rsquo;t trapped there. Pulse reads it only while it holds a grant;
              revoke and Pulse forgets.
            </p>
          </div>
          <div>
            <div className="text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>Enforced, not promised</div>
            <p className="mt-1.5 lethe-body lethe-measure" style={{ color: "var(--text)" }}>
              Ownership is an object you hold; access is a transaction anyone can verify. These
              aren&rsquo;t policy commitments a company can quietly change — they&rsquo;re properties of where
              the memory lives.
            </p>
          </div>
        </div>
      </section>

      {/* ── Proof of Demand — the page’s single DARK inverted panel ── */}
      <section className="max-w-6xl mx-auto w-full px-6 lethe-section" style={{ paddingTop: 0 }}>
        <div className="rounded px-8 py-12 md:px-14 md:py-14 lethe-rise" data-reveal style={{ background: "var(--text)", color: "var(--bg)" }}>
          <div className="lethe-eyebrow">Proof of demand</div>
          <p className="mt-4 text-base md:text-lg leading-relaxed max-w-3xl" style={{ color: "var(--bg)" }}>
            Lethe&rsquo;s unit economics are denominated in WAL and SUI by design: every user
            action is sponsored Sui gas; every memory is a Walrus blob Lethe pays for. As users
            grow, Lethe drives real, recurring WAL demand — storage plus renewals, for every
            user, every epoch.
          </p>
          <p className="mt-6 lethe-body lethe-measure" style={{ color: "rgba(239,245,244,0.7)" }}>
            Revenue covers costs, funds storage and renewals for all users, and scales Walrus
            consumption with adoption.
          </p>

          <DemandLoop />

          <p className="mt-8 text-center text-base md:text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--bg)" }}>
            Every Lethe user = a paying Walrus customer · verifiable on-chain
          </p>
        </div>
      </section>

      {/* ── Growth map — three rings around one vault (same #roadmap slot) ── */}
      <section id="roadmap" className="max-w-6xl mx-auto w-full px-6 lethe-section" style={{ paddingTop: 0 }}>
        <div className="lethe-eyebrow">How this grows</div>
        <h2 className="lethe-section-head">Three rings around one vault</h2>
        <p className="mt-3 lethe-body lethe-measure" style={{ color: "var(--text)" }}>
          Most roadmaps ask you to believe. This one is mostly receipts — verify any line.
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[5fr_6fr] gap-10 lg:gap-16 items-center">
          {/* rings — desktop bigger so band labels read; mobile gets a near-full-width motif */}
          <div className="hidden lg:block" aria-hidden="true">
            <GrowthRings />
          </div>
          <div className="lg:hidden mx-auto w-full max-w-xs" aria-hidden="true">
            <GrowthRings />
          </div>

          <div>
            {GROWTH.map((g, i) => (
              <div
                key={g.tag}
                className="py-6 lethe-rise"
                style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
                data-reveal
                data-reveal-delay={i * 80}
              >
                <div className="lethe-id uppercase" style={{ color: g.now ? "var(--accent-h)" : "var(--text-dim)" }}>
                  {g.tag}
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-x-4 gap-y-2.5">
                  <span className="lethe-id uppercase pt-1" style={{ color: "var(--accent-h)" }}>Live today</span>
                  <p className="lethe-body" style={{ color: "var(--text)" }}>{g.live}</p>
                  {g.unlock && (
                    <>
                      <span className="lethe-id uppercase pt-1" style={{ color: "#5A8A9E" }}>One unlock away</span>
                      <p className="lethe-body" style={{ color: "var(--text)" }}>{g.unlock}</p>
                    </>
                  )}
                  <span className="lethe-id uppercase pt-1" style={{ color: "#5A8A9E" }}>Revenue</span>
                  <p className="lethe-body" style={{ color: "var(--text)" }}>{g.revenue}</p>
                </div>
                {g.closing && (
                  <p className="mt-2.5 lethe-body italic" style={{ color: "var(--text-muted)" }}>{g.closing}</p>
                )}
                {g.sub && (
                  <p className="mt-3 lethe-measure text-[0.82rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>{g.sub}</p>
                )}
                {g.stable && (
                  <p className="mt-3 lethe-body lethe-measure" style={{ color: "#5A8A9E" }}>{g.stable}</p>
                )}
                {g.horizon && (
                  <p className="mt-3 lethe-body lethe-measure" style={{ color: "#5A8A9E" }}>{g.horizon}</p>
                )}
                {g.footnote && (
                  <p className="mt-3 lethe-measure text-[0.82rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>{g.footnote}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <p
          className="mt-12 text-center italic mx-auto max-w-2xl"
          style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", lineHeight: 1.45, color: "var(--text)" }}
        >
          The inner ring is the biggest one — and it already shipped. The rings
          ahead are smaller.
        </p>
      </section>

      {/* ── Colophon — set like the last page of a book ── */}
      <footer className="w-full" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-2xl mx-auto px-6 py-12 text-center flex flex-col items-center gap-4">
          <div className="lethe-id" style={{ color: "var(--text-dim)" }}>· COLOPHON ·</div>
          {/* Stack marks live in the "Built on" strip below the hero — not duplicated here. */}
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

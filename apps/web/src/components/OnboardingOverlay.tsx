"use client";

/**
 * First-run onboarding — three quiet panels that say what Lethe is before the
 * user types. "Letterpress on water" styling (Fog/Ink/Coral, Fraunces display);
 * one line + a hairline glyph each. Fast: a cheap opacity cross-fade, no heavy
 * motion that would delay first use, and prefers-reduced-motion is respected.
 *
 * Gating lives in the parent (chat page): it mounts this ONLY for a fresh
 * visitor with no saved memories, and records "seen" in session state — so a
 * returning user (who owns memories) never sees it. No user data is shown here;
 * the copy is generic product framing, so there is nothing fake to leak.
 */

import { useCallback, useEffect, useState } from "react";

type Panel = { line: string; sub: string; glyph: React.ReactNode };

const stroke = "var(--accent-strong)";

const PANELS: Panel[] = [
  {
    line: "Lethe remembers you — and you own that memory.",
    sub: "Not a setting on someone else's server. Yours.",
    glyph: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <circle cx="22" cy="22" r="18" stroke="var(--border)" strokeWidth="1.25" />
        <circle cx="22" cy="22" r="11" stroke={stroke} strokeWidth="1.5" />
        <circle cx="22" cy="22" r="3.5" fill={stroke} />
      </svg>
    ),
  },
  {
    line: "Chat with any model. Your memory lives on Walrus, controlled by you on-chain.",
    sub: "Switch models freely — what they know about you travels with you.",
    glyph: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <circle cx="9" cy="11" r="3" stroke="var(--border)" strokeWidth="1.25" />
        <circle cx="9" cy="22" r="3" stroke="var(--border)" strokeWidth="1.25" />
        <circle cx="9" cy="33" r="3" stroke="var(--border)" strokeWidth="1.25" />
        <path d="M13 11C24 11 24 22 33 22M13 22H33M13 33C24 33 24 22 33 22" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="35" cy="22" r="4" fill={stroke} />
      </svg>
    ),
  },
  {
    line: "Grant any app access. Revoke anytime — it forgets, live.",
    sub: "Permission is on-chain and reversible. You decide who reads you.",
    glyph: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <circle cx="16" cy="22" r="7" stroke={stroke} strokeWidth="1.5" />
        <path d="M23 22H38M34 18V26" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11 27L33 11" stroke="var(--accent-h)" strokeWidth="1.25" strokeLinecap="round" strokeDasharray="2 3" />
      </svg>
    ),
  },
];

export function OnboardingOverlay({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const last = i === PANELS.length - 1;

  const close = useCallback(() => onClose(), [onClose]);
  const next = useCallback(() => (last ? close() : setI((n) => n + 1)), [last, close]);

  // Escape skips; arrows page. Keyboard reachable from first paint.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, next]);

  const p = PANELS[i];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Lethe"
      className="fixed inset-0 z-[60] flex items-center justify-center px-5"
      style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)", backdropFilter: "blur(3px)" }}
      onClick={close}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border p-8 sm:p-10"
        style={{ background: "var(--bg-panel)", borderColor: "var(--border)", boxShadow: "var(--shadow-ambient)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          data-testid="onboarding-skip"
          className="absolute top-4 right-4 lethe-id uppercase hover:opacity-70 transition"
          style={{ color: "var(--text-dim)" }}
        >
          Skip
        </button>

        {/* glyph + line cross-fade on step change (cheap opacity only) */}
        <div key={i} className="lethe-onboard-fade flex flex-col items-center text-center">
          <div className="mb-5">{p.glyph}</div>
          <h2
            className="text-2xl leading-snug"
            style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
          >
            {p.line}
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {p.sub}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {PANELS.map((_, n) => (
              <span
                key={n}
                className="block rounded-full transition-all"
                style={{
                  width: n === i ? 18 : 6,
                  height: 6,
                  background: n === i ? "var(--accent-strong)" : "var(--border)",
                }}
              />
            ))}
          </div>
          <button
            onClick={next}
            data-testid="onboarding-next"
            className="h-10 px-5 rounded-lg text-sm font-semibold hover:opacity-90 transition"
            style={{ background: "var(--accent-strong)", color: "var(--bg-panel)" }}
          >
            {last ? "Enter Lethe" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

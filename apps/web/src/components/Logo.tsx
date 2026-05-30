import Link from "next/link";

/**
 * Lethe brand lockup — the inline mark (crisp at any size) + the "lethe"
 * wordmark in the site's display font. Brand colors: Ink #1A3A4A, Fog #EFF5F4,
 * Coral #E8B894 (matches public/brand/lethe-mark-light.svg). Links to home.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Lethe — home"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true" className="shrink-0">
        <circle cx="50" cy="50" r="42" fill="#1A3A4A" />
        <text
          x="50"
          y="62"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="42"
          fill="#EFF5F4"
          textAnchor="middle"
          fontStyle="italic"
        >
          L
        </text>
        <circle cx="73" cy="58" r="4" fill="#E8B894" />
      </svg>
      <span
        className="text-xl tracking-tight"
        style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
      >
        lethe
      </span>
    </Link>
  );
}

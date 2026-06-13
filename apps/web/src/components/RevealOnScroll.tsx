"use client";

import { useEffect } from "react";

/**
 * Block 13 — the ONE motion layer. Observes every [data-reveal] element and
 * adds `is-in` once, when it scrolls into view (fade + 12px rise via
 * .lethe-rise). The hidden state is gated by `html.reveal-ready` (set pre-paint
 * in the root layout), so no-JS and prefers-reduced-motion users get the content
 * instantly — no transform, no layout shift. `data-reveal-delay="<ms>"` staggers
 * siblings (e.g. the three product frames, the ring blocks).
 */
export function RevealOnScroll() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;

    // Reduced motion: reveal everything immediately, never observe.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }

    for (const el of els) {
      const delay = el.dataset.revealDelay;
      if (delay) el.style.transitionDelay = `${delay}ms`;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));

    // Safety net: never leave content hidden if the observer misfires.
    const t = window.setTimeout(() => els.forEach((el) => el.classList.add("is-in")), 1800);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  return null;
}

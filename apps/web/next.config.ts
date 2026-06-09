import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // apps/web is self-contained — no workspace packages to transpile.

  // Re-aim: Lethe is owned AI memory, not art collectibles. The old art
  // surfaces (/create, /me, /battle, /leaderboard) are superseded by the
  // memory product. Redirect them to the live flow so the shopfront stays
  // coherent. Source pages are kept (not deleted) to avoid build churn; the
  // routing layer makes them unreachable.
  async redirects() {
    return [
      { source: "/create", destination: "/chat", permanent: false },
      { source: "/me", destination: "/memory", permanent: false },
      { source: "/battle", destination: "/chat", permanent: false },
      { source: "/leaderboard", destination: "/chat", permanent: false },
    ];
  },
};

export default nextConfig;

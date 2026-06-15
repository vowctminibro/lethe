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
      // /pricing has no page of its own — pricing lives in the #pricing
      // section on the landing page. Send any direct/external /pricing hit
      // there so the link is never dead.
      { source: "/pricing", destination: "/#pricing", permanent: false },
      { source: "/create", destination: "/chat", permanent: false },
      { source: "/me", destination: "/memory", permanent: false },
      { source: "/battle", destination: "/chat", permanent: false },
      { source: "/leaderboard", destination: "/chat", permanent: false },
    ];
  },
};

export default nextConfig;

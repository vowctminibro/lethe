import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship raw TS; let Next transpile them.
  transpilePackages: ["@lethe/shared", "@lethe/sdk"],
};

export default nextConfig;

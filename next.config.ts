import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this standalone app when the parent workspace has its own lockfile.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next ignores unrelated lockfiles
  // elsewhere on the machine (e.g. ~/package-lock.json).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

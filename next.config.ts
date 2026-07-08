import type { NextConfig } from "next";
import path from "node:path";

/**
 * Baseline security headers applied to every response. We intentionally omit a
 * strict Content-Security-Policy for now: the site embeds YouTube/Spotify
 * iframes and injects the theme as an inline <style>, so a CSP needs careful
 * per-source tuning (a separate task) to avoid breaking those.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next ignores unrelated lockfiles
  // elsewhere on the machine (e.g. ~/package-lock.json).
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

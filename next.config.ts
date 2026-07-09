import type { NextConfig } from "next";
import path from "node:path";

/**
 * Content-Security-Policy allow-list, tuned for what this site actually loads:
 * self, the inline theme <style> and Next's inline hydration scripts, the
 * YouTube/Spotify embeds + their iframe APIs, analytics (GA4 + Cloudflare), and
 * images from anywhere over https (user-uploaded logos, Cloudinary, Google
 * Photos). **Enforcing** (validated first in Report-Only with zero violations);
 * `report-uri` → `/api/csp-report` still logs anything blocked in production.
 */
// React needs eval() only in `next dev`; production (and workerd) never do — so
// 'unsafe-eval' is added in development only, keeping the production CSP strict.
const devEval = process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${devEval} https://www.googletagmanager.com https://static.cloudflareinsights.com https://www.youtube.com https://s.ytimg.com https://open.spotify.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://open.spotify.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://region1.google-analytics.com https://static.cloudflareinsights.com https://cloudflareinsights.com https://www.youtube.com https://s.ytimg.com https://open.spotify.com",
  "worker-src 'self' blob:",
  "report-uri /api/csp-report",
].join("; ");

/** Baseline security headers applied to every response. */
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
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
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

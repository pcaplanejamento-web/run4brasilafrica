"use client";

import { useEffect } from "react";
import type { Analytics as AnalyticsConfig } from "@/lib/content/types";

/**
 * Injects web-analytics scripts when configured in ADM > Configurações:
 * Cloudflare Web Analytics (privacy-friendly, no cookies) and/or Google
 * Analytics 4. Loads once; no-op when nothing is set.
 */
export default function Analytics({ analytics }: { analytics?: AnalyticsConfig }) {
  const cf = analytics?.cfBeaconToken?.trim();
  const ga = analytics?.gaId?.trim();

  useEffect(() => {
    if (cf && !document.querySelector('script[src*="cloudflareinsights.com"]')) {
      const s = document.createElement("script");
      s.defer = true;
      s.src = "https://static.cloudflareinsights.com/beacon.min.js";
      s.setAttribute("data-cf-beacon", JSON.stringify({ token: cf }));
      document.body.appendChild(s);
    }
  }, [cf]);

  useEffect(() => {
    if (!ga || document.querySelector(`script[src*="gtag/js?id=${ga}"]`)) return;
    const loader = document.createElement("script");
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`;
    document.head.appendChild(loader);
    const init = document.createElement("script");
    init.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`;
    document.head.appendChild(init);
  }, [ga]);

  return null;
}

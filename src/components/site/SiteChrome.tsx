"use client";

import { useEffect } from "react";

/** Theme keys → the CSS custom properties they override. */
const THEME_VARS: Record<string, string[]> = {
  background: ["--color-ink"],
  accent: ["--color-gold"],
  accentText: ["--color-gold-ink"],
  text: ["--color-cream"],
  sections: ["--color-ink-deep", "--color-ink-deeper"],
  cards: ["--color-ink-panel", "--color-ink-card"],
  heroRed: ["--color-brasil", "--color-brasil-2"],
};

/**
 * Applies the ADM-configured chrome to every page (public + admin): the favicon
 * (branding.favicon) and the color theme (content.theme → CSS variables). Reads
 * the content once from /api/content; unset values keep the defaults.
 */
export default function SiteChrome() {
  useEffect(() => {
    let alive = true;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data?.content) return;
        const c = data.content as {
          branding?: { favicon?: string };
          theme?: Record<string, string | undefined>;
        };

        const fav = c.branding?.favicon;
        if (fav) {
          let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = fav;
        }

        const theme = c.theme ?? {};
        const root = document.documentElement;
        Object.entries(THEME_VARS).forEach(([key, vars]) => {
          const value = theme[key];
          if (value) vars.forEach((v) => root.style.setProperty(v, value));
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return null;
}

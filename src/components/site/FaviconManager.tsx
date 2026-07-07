"use client";

import { useEffect } from "react";

/**
 * Applies the ADM-configured favicon (branding.favicon) to the browser tab.
 * Runs on every page (public + admin). Falls back to the static app/icon.svg
 * when none is set.
 */
export default function FaviconManager() {
  useEffect(() => {
    let alive = true;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        const fav = data?.content?.branding?.favicon as string | undefined;
        if (!fav) return;
        let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = fav;
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return null;
}

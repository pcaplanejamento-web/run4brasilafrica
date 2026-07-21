"use client";

import { useEffect } from "react";

/**
 * Keeps the CSS `scroll-padding-top` (via the `--sticky-h` variable) in sync with
 * the ACTUAL height of the sticky header (`#site-sticky-header` = SiteNav +
 * countdown bar). The header is taller on desktop than mobile and the countdown
 * bar can come and go, so a fixed offset would either hide a clicked section's
 * title under the header or leave a gap. Measuring at runtime makes every in-page
 * link land exactly on the top edge of the target section, on any screen size.
 *
 * Renders nothing; it only writes a CSS variable on <html>.
 */
export default function StickyOffset() {
  useEffect(() => {
    const header = document.getElementById("site-sticky-header");
    if (!header) return;

    const apply = () => {
      const h = `${header.offsetHeight}px`;
      // Set BOTH: the CSS var (used by the globals.css fallback rule) and the
      // inline `scroll-padding-top` directly — the inline property reliably wins
      // over the stylesheet regardless of custom-property resolution quirks.
      document.documentElement.style.setProperty("--sticky-h", h);
      document.documentElement.style.scrollPaddingTop = h;
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(header);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  return null;
}

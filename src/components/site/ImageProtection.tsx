"use client";

import { useEffect } from "react";

/**
 * Site-wide image protection deterrents: blocks the context menu and drag on
 * images. NOTE: OS-level screenshots cannot be technically prevented — this
 * deters casual copying/saving; the watermark (ProtectedImage) covers the rest.
 */
export default function ImageProtection() {
  useEffect(() => {
    const isImg = (t: EventTarget | null) =>
      t instanceof Element && (t.tagName === "IMG" || !!t.closest(".protected-media"));
    const onCtx = (e: MouseEvent) => {
      if (isImg(e.target)) e.preventDefault();
    };
    const onDrag = (e: DragEvent) => {
      if (isImg(e.target)) e.preventDefault();
    };
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("dragstart", onDrag);
    return () => {
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("dragstart", onDrag);
    };
  }, []);
  return null;
}

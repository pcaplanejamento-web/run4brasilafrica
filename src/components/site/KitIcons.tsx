import type { ReactNode } from "react";

/**
 * Built-in line-icon library for kit items (no emojis, Plano §4.4). Each entry
 * is drawn on a 24×24 viewBox with `stroke="currentColor"`. `KIT_ICONS` powers
 * the ADM picker; `KitIcon` renders one (falls back to a check mark).
 */
const PATHS: Record<string, ReactNode> = {
  shirt: (
    <path d="M8 4 4 6.5 6 10l2-1v11h8V9l2 1 2-3.5L16 4l-2 2a3.2 3.2 0 0 1-4 0z" />
  ),
  bib: (
    <>
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  backpack: (
    <>
      <path d="M9 6V5a3 3 0 0 1 6 0v1" />
      <path d="M6 8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" />
      <path d="M9 13h6" />
    </>
  ),
  cap: (
    <>
      <path d="M4 14c0-5 3.6-8 8-8 3 0 5 2 5 5v3H4z" />
      <path d="M17 12h2.5a1.5 1.5 0 0 1 0 3H17" />
    </>
  ),
  bottle: (
    <>
      <path d="M10 3h4v2.5l1 2V19a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7.5l1-2z" />
      <path d="M9 12h6" />
    </>
  ),
  medal: (
    <>
      <path d="M9 3l1.5 5M15 3l-1.5 5" />
      <circle cx="12" cy="15" r="5" />
      <path d="M12 13v3l1.6 1" />
    </>
  ),
  glasses: (
    <>
      <circle cx="6.5" cy="13" r="3" />
      <circle cx="17.5" cy="13" r="3" />
      <path d="M9.5 13h5M3.5 11l1-2M20.5 11l-1-2" />
    </>
  ),
  bag: (
    <>
      <path d="M6.5 8h11l-1 12h-9z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  bar: (
    <>
      <path d="M4 9h16v6H4z" />
      <path d="M8 9v6M12 9v6M16 9v6" />
    </>
  ),
  jacket: (
    <>
      <path d="M9 4 4 6v14h4" />
      <path d="M15 4l5 2v14h-4" />
      <path d="M9 4l3 2 3-2M12 6v14" />
    </>
  ),
  shoe: (
    <>
      <path d="M3 16v-4l5-2 3 3 5 1a3 3 0 0 1 3 3v1H3z" />
      <path d="M3 18h18" />
    </>
  ),
  towel: (
    <>
      <path d="M5 5h14v14H5z" />
      <path d="M9 5v14M5 9h14" />
    </>
  ),
};

export const KIT_ICONS: { key: string; label: string }[] = [
  { key: "shirt", label: "Camiseta" },
  { key: "bib", label: "Número" },
  { key: "backpack", label: "Mochila" },
  { key: "cap", label: "Boné" },
  { key: "bottle", label: "Garrafinha" },
  { key: "medal", label: "Medalha" },
  { key: "glasses", label: "Óculos" },
  { key: "bag", label: "Sacola" },
  { key: "bar", label: "Barra" },
  { key: "jacket", label: "Corta-vento" },
  { key: "shoe", label: "Tênis" },
  { key: "towel", label: "Toalha" },
];

export function KitIcon({ name, size = 30 }: { name?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {(name && PATHS[name]) || (
        <path d="M5 13l4 4L19 7" strokeWidth={2.2} />
      )}
    </svg>
  );
}

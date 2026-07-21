/**
 * Pure YouTube URL helpers. Kept in a **non-client** module so they can be
 * called from Server Components (e.g. `CustomSectionView`) as well as client
 * ones. Importing these from a `"use client"` module would mark them as client
 * references and calling them during SSR throws.
 */

/** Extract a YouTube video ID from watch/youtu.be/embed/shorts links or a bare ID. */
export function youtubeId(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  );
  if (m) return m[1];
  return /^[\w-]{11}$/.test(url) ? url : null;
}

/** True for YouTube Shorts links — those videos are vertical (9:16). */
export function isVerticalYouTube(url: string | undefined): boolean {
  return !!url && /\/shorts\//.test(url);
}

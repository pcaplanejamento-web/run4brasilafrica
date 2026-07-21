"use client";

import SectionAbaRedirect from "@/components/admin/sections/SectionAbaRedirect";

/** "Playlist do evento" agora é uma aba — redireciona ao editor da aba. */
export default function PlaylistPage() {
  return <SectionAbaRedirect id="sec-playlist" kind="playlist" title="Playlist do evento" />;
}

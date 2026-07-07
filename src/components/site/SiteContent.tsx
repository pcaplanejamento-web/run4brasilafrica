"use client";

import { useEffect, useState } from "react";
import type { SiteContent as SiteContentType } from "@/lib/content/types";
import SiteNav from "./SiteNav";
import Hero from "./Hero";
import StatsBar from "./StatsBar";
import Sobre from "./Sobre";
import Playlist from "./Playlist";
import Percurso from "./Percurso";
import RaceDay from "./RaceDay";
import { AudioBusProvider } from "./AudioBus";
import InscricaoCTA from "./InscricaoCTA";
import Galeria from "./Galeria";
import Parceiros from "./Parceiros";
import Depoimentos from "./Depoimentos";
import Faq from "./Faq";
import KitAtleta from "./KitAtleta";
import SiteFooter from "./SiteFooter";

/**
 * Renders the public site. Server-renders from `initial` (the seed) for SEO and
 * instant paint, then fetches the live content from /api/content on the client
 * and swaps it in. We hydrate on the client because reading the Cloudflare D1
 * binding during server rendering is unreliable under OpenNext, whereas the
 * browser → route handler path is solid (it's what the ADM uses).
 */
export default function SiteContent({ initial }: { initial: SiteContentType }) {
  const [c, setC] = useState(initial);

  useEffect(() => {
    let alive = true;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.content) setC(data.content as SiteContentType);
      })
      .catch(() => {
        /* keep the seed we rendered with */
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <SiteNav logo={c.branding?.logo} />
      <AudioBusProvider>
        <main>
          <Hero hero={c.hero} />
          <StatsBar stats={c.stats} />
          <Sobre about={c.about} />
          <Playlist playlist={c.playlist} />
          <Percurso percurso={c.percurso} />
          <RaceDay inscricao={c.inscricao} />
          <InscricaoCTA inscricao={c.inscricao} lotes={c.lotes ?? []} />
          <Galeria
            albums={c.albums ?? []}
            tiles={c.galleryTiles}
            photos={c.galleryPhotos ?? []}
            gallery={c.gallery}
          />
          <Parceiros sponsors={c.sponsors} />
          <Depoimentos testimonials={c.testimonials} />
          <Faq items={c.faq} />
          <KitAtleta kit={c.kit} lotes={c.lotes ?? []} />
        </main>
      </AudioBusProvider>
      <SiteFooter contact={c.contact} logo={c.branding?.logo} />
    </>
  );
}

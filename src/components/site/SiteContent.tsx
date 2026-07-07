"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import type { SiteContent as SiteContentType } from "@/lib/content/types";
import { resolveLayout } from "@/lib/content/sections";
import SiteNav from "./SiteNav";
import Hero from "./Hero";
import StatsBar from "./StatsBar";
import Sobre from "./Sobre";
import Playlist from "./Playlist";
import Percurso from "./Percurso";
import RaceDay from "./RaceDay";
import RaceCountdownBar from "./RaceCountdownBar";
import WhatsAppFloat from "./WhatsAppFloat";
import EventJsonLd from "./EventJsonLd";
import Analytics from "./Analytics";
import { AudioBusProvider } from "./AudioBus";
import InscricaoCTA from "./InscricaoCTA";
import Galeria from "./Galeria";
import Parceiros from "./Parceiros";
import Depoimentos from "./Depoimentos";
import Faq from "./Faq";
import KitAtleta from "./KitAtleta";
import Resultados from "./Resultados";
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

  // Each homepage section keyed so the ADM dashboard can reorder / toggle them.
  const rendered: Record<string, ReactNode> = {
    hero: <Hero hero={c.hero} />,
    stats: <StatsBar stats={c.stats} />,
    about: <Sobre about={c.about} />,
    playlist: <Playlist playlist={c.playlist} />,
    percurso: <Percurso percurso={c.percurso} />,
    raceday: <RaceDay inscricao={c.inscricao} />,
    inscricao: <InscricaoCTA inscricao={c.inscricao} lotes={c.lotes ?? []} />,
    galeria: (
      <Galeria
        albums={c.albums ?? []}
        tiles={c.galleryTiles}
        photos={c.galleryPhotos ?? []}
        gallery={c.gallery}
      />
    ),
    parceiros: <Parceiros sponsors={c.sponsors} />,
    depoimentos: <Depoimentos testimonials={c.testimonials} />,
    faq: <Faq items={c.faq} />,
    kit: <KitAtleta kit={c.kit} lotes={c.lotes ?? []} />,
    resultados: <Resultados results={c.results} />,
  };
  const layout = resolveLayout(c.layout);

  return (
    <>
      <EventJsonLd c={c} />
      <Analytics analytics={c.analytics} />
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <div className="sticky top-0 z-30">
        <SiteNav logo={c.branding?.logo} lotes={c.lotes ?? []} />
        <RaceCountdownBar inscricao={c.inscricao} />
      </div>
      <AudioBusProvider>
        <main id="conteudo">
          {layout
            .filter((li) => li.enabled && rendered[li.key])
            .map((li) => (
              <Fragment key={li.key}>{rendered[li.key]}</Fragment>
            ))}
        </main>
      </AudioBusProvider>
      <SiteFooter contact={c.contact} logo={c.branding?.logo} />
      <WhatsAppFloat contact={c.contact} />
    </>
  );
}

import { Fragment, type ReactNode } from "react";
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
import Premiacao from "./Premiacao";
import SiteFooter from "./SiteFooter";

/**
 * Renders the public site from the LIVE content already read on the server
 * (`page.tsx` → D1 per request via the OpenNext async binding). No client-side
 * content swap, so there's no flash of seed/placeholder — colors (SSR theme),
 * banner, images and components are correct on the first paint.
 */
export default function SiteContent({ initial }: { initial: SiteContentType }) {
  // The server already rendered the live content (page.tsx reads D1 per request),
  // so there is no client-side swap — this avoids flashes (colors, hero image,
  // gallery reload). `force-dynamic` means every page load is already fresh.
  const c = initial;

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
    premiacao: <Premiacao premiacao={c.premiacao} />,
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

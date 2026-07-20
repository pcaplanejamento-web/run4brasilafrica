import { Fragment, type ReactNode } from "react";
import type { SiteContent as SiteContentType } from "@/lib/content/types";
import { resolveLayout, customKey } from "@/lib/content/sections";
import { carouselsOf, activeCarousel } from "@/lib/content/carousels";
import SiteNav from "./SiteNav";
import HeroCarousels from "./HeroCarousels";
import StatsBar from "./StatsBar";
import Sobre from "./Sobre";
import Playlist from "./Playlist";
import Percurso from "./Percurso";
import Localizacao from "./Localizacao";
import RaceDay from "./RaceDay";
import RaceCountdownBar from "./RaceCountdownBar";
import WhatsAppFloat from "./WhatsAppFloat";
import EventJsonLd from "./EventJsonLd";
import Analytics from "./Analytics";
import { AudioBusProvider } from "./AudioBus";
import InscricaoCTA from "./InscricaoCTA";
import Galeria from "./Galeria";
import Parceiros from "./Parceiros";
import SejaParceiro from "./SejaParceiro";
import Depoimentos from "./Depoimentos";
import Faq from "./Faq";
import KitAtleta from "./KitAtleta";
import Premiacao from "./Premiacao";
import ShareEvent from "./ShareEvent";
import CustomSectionView from "./CustomSectionView";
import SiteFooter from "./SiteFooter";
import PrivacyModal from "./PrivacyModal";
import OrganizersModal from "./OrganizersModal";

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

  const customSections = c.customSections ?? [];
  const layout = resolveLayout(
    c.layout,
    customSections.map((s) => s.id),
  );
  // The "Seja um parceiro" CTA only works when its target section is enabled.
  const sejaAtiva = layout.some((li) => li.key === "sejaParceiro" && li.enabled);

  // Banner: pick the carousel on air now (server pick for the first paint; the
  // client re-evaluates live). `carouselsOf` guarantees a non-empty list with one
  // perpetual default, so the banner is never empty.
  const carousels = carouselsOf(c);
  const initialCarousel = activeCarousel(carousels, Date.now()) ?? carousels[0];

  // Each homepage section keyed so the ADM dashboard can reorder / toggle them.
  const rendered: Record<string, ReactNode> = {
    hero: <HeroCarousels carousels={carousels} initialId={initialCarousel.id} />,
    stats: <StatsBar stats={c.stats ?? []} />,
    about: <Sobre about={c.about} />,
    playlist: <Playlist playlist={c.playlist} />,
    percurso: <Percurso percurso={c.percurso} />,
    location: <Localizacao location={c.location} />,
    raceday: <RaceDay inscricao={c.inscricao} />,
    inscricao: <InscricaoCTA inscricao={c.inscricao} lotes={c.lotes ?? []} />,
    galeria: (
      <Galeria
        albums={c.albums ?? []}
        tiles={c.galleryTiles ?? []}
        photos={c.galleryPhotos ?? []}
        gallery={c.gallery}
      />
    ),
    parceiros: (
      <Parceiros
        sponsors={c.sponsors ?? []}
        showTier={c.sponsorsShowTier}
        subtitle={c.sponsorsSubtitle}
        showCta={(c.sponsorsShowCta ?? false) && sejaAtiva}
      />
    ),
    sejaParceiro: <SejaParceiro config={c.sejaParceiro ?? {}} />,
    depoimentos: <Depoimentos testimonials={c.testimonials ?? []} />,
    faq: <Faq items={c.faq ?? []} />,
    kit: <KitAtleta kit={c.kit} lotes={c.lotes ?? []} />,
    premiacao: <Premiacao premiacao={c.premiacao} />,
    compartilhar: <ShareEvent share={c.share} event={c.event} />,
  };
  // Custom "abas" built in the ADM, keyed as `custom:<id>`.
  for (const cs of customSections) {
    rendered[customKey(cs.id)] = <CustomSectionView section={cs} />;
  }

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
      <SiteFooter
        contact={c.contact}
        logo={c.branding?.logo}
        showOrganizers={c.organizers?.enabled !== false}
      />
      <WhatsAppFloat contact={c.contact} />
      <PrivacyModal privacy={c.privacy} />
      <OrganizersModal organizers={c.organizers} />
    </>
  );
}

import { Fragment, type ReactNode } from "react";
import type { SiteContent as SiteContentType } from "@/lib/content/types";
import { resolveLayout, customKey } from "@/lib/content/sections";
import { carouselsOf, activeCarousel } from "@/lib/content/carousels";
import SiteNav from "./SiteNav";
import HeroCarousels from "./HeroCarousels";
import RaceCountdownBar from "./RaceCountdownBar";
import WhatsAppFloat from "./WhatsAppFloat";
import EventJsonLd from "./EventJsonLd";
import Analytics from "./Analytics";
import { AudioBusProvider } from "./AudioBus";
import CustomSectionView, { type SectionRenderCtx } from "./CustomSectionView";
import SiteFooter from "./SiteFooter";
import StickyOffset from "./StickyOffset";
import PrivacyModal from "./PrivacyModal";
import OrganizersModal from "./OrganizersModal";

/**
 * Renders the public site from the LIVE content already read on the server
 * (`page.tsx` → D1 per request via the OpenNext async binding). No client-side
 * content swap, so there's no flash of seed/placeholder — colors (SSR theme),
 * banner, images and components are correct on the first paint.
 */
export default function SiteContent({ initial }: { initial: SiteContentType }) {
  // The server rendered the live content (page.tsx reads D1; the route uses ISR,
  // `revalidate = 30`, so pages are regenerated in the background). No client-side
  // content swap → no flash of seed/placeholder (colors, hero image, gallery).
  const c = initial;

  const customSections = c.customSections ?? [];
  const layout = resolveLayout(
    c.layout,
    customSections.map((s) => s.id),
  );
  // The "Seja um parceiro" CTA only works when its target section is enabled —
  // whether it's still the built-in `sejaParceiro` key or already an aba.
  const sejaParceiroEnabled = layout.some(
    (li) =>
      li.enabled &&
      (li.key === "sejaParceiro" || li.key === customKey("sec-sejaParceiro")),
  );

  // Banner: pick the carousel on air now (server pick for the first paint; the
  // client re-evaluates live). `carouselsOf` guarantees a non-empty list with one
  // perpetual default, so the banner is never empty.
  const carousels = carouselsOf(c);
  const nowMs = Date.now();
  const initialCarousel = activeCarousel(carousels, nowMs) ?? carousels[0];

  // Global content that `secao` blocks (inside abas) may need at render time.
  const ctx: SectionRenderCtx = {
    lotes: c.lotes ?? [],
    inscricao: c.inscricao,
    event: c.event,
    gallery: c.gallery,
    albums: c.albums ?? [],
    galleryTiles: c.galleryTiles ?? [],
    galleryPhotos: c.galleryPhotos ?? [],
    sejaParceiroEnabled,
    nowMs,
  };

  // Só o Banner/Hero permanece built-in; todas as demais seções renderizam via
  // `custom:sec-*` (abas). "A Causa" (`about`) é convertida em aba `custom:a-causa`
  // pela migração (migrate.ts) a cada leitura, então não há chave `about` no
  // layout — o render dela vem da aba, como as outras seções.
  const rendered: Record<string, ReactNode> = {
    hero: <HeroCarousels carousels={carousels} initialId={initialCarousel.id} />,
  };
  // Custom "abas" built in the ADM, keyed as `custom:<id>`.
  for (const cs of customSections) {
    rendered[customKey(cs.id)] = <CustomSectionView section={cs} ctx={ctx} />;
  }

  return (
    <>
      <EventJsonLd c={c} />
      <Analytics analytics={c.analytics} />
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <StickyOffset />
      <div id="site-sticky-header" className="sticky top-0 z-30">
        <SiteNav
          logo={c.branding?.logo}
          lotes={c.lotes ?? []}
          showOrganizers={c.organizers?.enabled !== false}
        />
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

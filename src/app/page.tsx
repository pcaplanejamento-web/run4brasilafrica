import { getPublishedContent } from "@/lib/content/server";
import SiteNav from "@/components/site/SiteNav";
import Hero from "@/components/site/Hero";
import StatsBar from "@/components/site/StatsBar";
import Sobre from "@/components/site/Sobre";
import Percurso from "@/components/site/Percurso";
import InscricaoCTA from "@/components/site/InscricaoCTA";
import Galeria from "@/components/site/Galeria";
import Parceiros from "@/components/site/Parceiros";
import Depoimentos from "@/components/site/Depoimentos";
import Faq from "@/components/site/Faq";
import KitAtleta from "@/components/site/KitAtleta";
import SiteFooter from "@/components/site/SiteFooter";

// Revalidate the published content periodically (ISR); ADM edits appear within
// this window. Falls back to the seed when the backend is unset/unreachable.
export const revalidate = 30;

/**
 * Public home page. Server-rendered from the live content (SEO-friendly);
 * interactive pieces (nav, counters, reveal, FAQ) are isolated client islands.
 */
export default async function Home() {
  const { content: c } = await getPublishedContent({ revalidateSeconds: 30 });
  return (
    <>
      <SiteNav />
      <main>
        <Hero hero={c.hero} />
        <StatsBar stats={c.stats} />
        <Sobre about={c.about} />
        <Percurso percurso={c.percurso} />
        <InscricaoCTA inscricao={c.inscricao} />
        <Galeria tiles={c.galleryTiles} />
        <Parceiros sponsors={c.sponsors} />
        <Depoimentos testimonials={c.testimonials} />
        <Faq items={c.faq} />
        <KitAtleta kit={c.kit} />
      </main>
      <SiteFooter contact={c.contact} />
    </>
  );
}

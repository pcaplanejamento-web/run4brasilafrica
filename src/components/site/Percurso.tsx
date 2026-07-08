import type { Percurso as PercursoType } from "@/lib/content/types";
import { percursoRoutes } from "@/lib/content/percurso";
import PercursoRoutes from "./PercursoRoutes";
import SectionEyebrow from "./SectionEyebrow";

/**
 * Course section. Shows the section title/eyebrow (ADM) and one or more routes;
 * with multiple routes the visitor switches between them and sees each route's
 * map (Strava / Garmin / fallback) and complementary data.
 */
export default function Percurso({ percurso }: { percurso: PercursoType }) {
  const routes = percursoRoutes(percurso);

  return (
    <section id="percurso" className="bg-ink-deep px-5 py-20 sm:px-8 md:px-14 md:py-[90px]">
      <SectionEyebrow className="mb-4">{percurso.eyebrow}</SectionEyebrow>
      <h2 className="mb-10 font-display text-[30px] font-bold uppercase md:mb-11 md:text-[40px]">
        {percurso.title}
      </h2>

      <PercursoRoutes routes={routes} />
    </section>
  );
}

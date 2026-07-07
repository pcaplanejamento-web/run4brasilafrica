import type { Percurso as PercursoType } from "@/lib/content/types";
import Reveal from "./Reveal";
import RouteViewer from "./RouteViewer";

/** Extract a numeric Strava route ID from an ID or a strava.com/routes/<id> link. */
function stravaRouteId(ref: string | undefined): string | null {
  if (!ref) return null;
  const m = ref.match(/(\d{4,})/);
  return m ? m[1] : null;
}

/**
 * Build a Garmin Connect embed URL from a course/activity/route link (numeric OR
 * UUID id). Garmin **event** pages (`/modern/event/<uuid>`) have no embeddable
 * map, so those return null — the visitor should use a course link.
 */
function garminEmbedUrl(ref: string | undefined): string | null {
  if (!ref) return null;
  const m = ref.match(/\/(course|activity|route)\/(?:embed\/)?([A-Za-z0-9_-]+)/i);
  if (m) {
    return `https://connect.garmin.com/modern/${m[1].toLowerCase()}/embed/${m[2]}`;
  }
  // Bare numeric id → assume a course.
  const n = ref.match(/^\s*(\d{4,})\s*$/);
  return n ? `https://connect.garmin.com/modern/course/embed/${n[1]}` : null;
}

/**
 * Course section. Shows the Strava and/or Garmin maps (public embeds) configured
 * in ADM > Percurso; when both exist, both are shown. Title and facts come from
 * the ADM (title is edited freely there).
 */
export default function Percurso({ percurso }: { percurso: PercursoType }) {
  const stravaId = stravaRouteId(percurso.stravaRouteRef);
  const garminUrl = garminEmbedUrl(percurso.garminRouteRef);
  const facts = [
    { label: "Distância", value: percurso.distance, big: true },
    { label: "Elevação", value: percurso.elevation, big: true },
    { label: "Largada/Chegada", value: percurso.startFinish, big: false },
  ];

  return (
    <section id="percurso" className="bg-ink-deep px-5 py-20 sm:px-8 md:px-14 md:py-[90px]">
      <div className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-gold">
        {percurso.eyebrow}
      </div>
      <h2 className="mb-10 font-display text-[30px] font-bold uppercase md:mb-11 md:text-[40px]">
        {percurso.title}
      </h2>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr] md:gap-12">
        <Reveal className="overflow-hidden border-2 border-gold bg-ink-panel">
          <RouteViewer stravaId={stravaId} garminUrl={garminUrl} />
        </Reveal>

        <Reveal delay={120} className="flex flex-col justify-center gap-6 md:gap-[26px]">
          {facts.map((f) => (
            <div key={f.label}>
              <div className="text-[12px] uppercase opacity-60">{f.label}</div>
              <div
                className={`font-display font-bold ${
                  f.big ? "text-[30px]" : "text-[22px]"
                }`}
              >
                {f.value}
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

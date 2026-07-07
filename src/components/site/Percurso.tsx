import type { Percurso as PercursoType } from "@/lib/content/types";
import Reveal from "./Reveal";
import StravaRoute from "./StravaRoute";

/** Extract a numeric Strava route ID from an ID or a strava.com/routes/<id> link. */
function stravaRouteId(ref: string | undefined): string | null {
  if (!ref) return null;
  const m = ref.match(/(\d{4,})/);
  return m ? m[1] : null;
}

/**
 * Course section. Shows the Strava route map (public embed) when a route ID is
 * configured in ADM > Strava; otherwise a placeholder. Facts come from the ADM.
 */
export default function Percurso({ percurso }: { percurso: PercursoType }) {
  const routeId = stravaRouteId(percurso.stravaRouteRef);
  // Heading adapts to the distance entered in the ADM: "10 KM" → "10KM DE PURA ...".
  const compactDistance = (percurso.distance || "").replace(/\s+/g, "");
  const heading = [compactDistance, percurso.title].filter(Boolean).join(" ");
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
        {heading}
      </h2>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr] md:gap-12">
        <Reveal className="overflow-hidden border-2 border-gold bg-ink-panel">
          {routeId ? (
            <StravaRoute routeId={routeId} />
          ) : (
            <div className="flex h-[240px] items-center justify-center md:h-[320px]">
              <span className="font-[monospace] text-[12px] text-muted">
                [ mapa do percurso — configure a rota no ADM &gt; Strava ]
              </span>
            </div>
          )}
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

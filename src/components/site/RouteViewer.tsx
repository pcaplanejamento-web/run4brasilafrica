import StravaRoute from "./StravaRoute";
import GarminRoute from "./GarminRoute";

function ProviderLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-line-soft bg-ink-panel px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-gold">
      {children}
    </div>
  );
}

/**
 * Shows the course map(s). When both Strava and Garmin are configured, BOTH are
 * shown (each labelled, stacked); otherwise shows whichever is set, or a
 * placeholder. Embeds fill the section width.
 */
export default function RouteViewer({
  stravaId,
  garminUrl,
}: {
  stravaId: string | null;
  garminUrl: string | null;
}) {
  const hasStrava = !!stravaId;
  const hasGarmin = !!garminUrl;
  const both = hasStrava && hasGarmin;

  if (!hasStrava && !hasGarmin) {
    return (
      <div className="flex h-[240px] items-center justify-center md:h-[320px]">
        <span className="font-[monospace] text-[12px] text-muted">
          [ mapa do percurso — configure Strava ou Garmin no ADM ]
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {hasStrava && (
        <div>
          {both && <ProviderLabel>Strava</ProviderLabel>}
          <StravaRoute routeId={stravaId as string} />
        </div>
      )}
      {hasGarmin && (
        <div className={both ? "border-t border-line-soft" : ""}>
          {both && <ProviderLabel>Garmin</ProviderLabel>}
          <GarminRoute url={garminUrl as string} />
        </div>
      )}
    </div>
  );
}

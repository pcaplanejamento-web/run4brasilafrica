/**
 * Garmin **event** presentation. Event pages have no embeddable map, so instead
 * of a blank iframe we show a card that opens the event on Garmin Connect (with
 * its map, schedule and details).
 */
export default function GarminEvent({ url }: { url: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-gold">
        Evento no Garmin
      </div>
      <p className="max-w-[420px] text-[14px] text-muted-strong">
        Este percurso está publicado como um evento no Garmin Connect. Abra o evento
        para ver o mapa, o horário e os detalhes da prova.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="clip-cta-lg inline-block bg-gold px-7 py-4 text-[15px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5"
      >
        Ver evento no Garmin
      </a>
    </div>
  );
}

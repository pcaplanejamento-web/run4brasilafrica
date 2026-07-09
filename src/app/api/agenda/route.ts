import { getSiteContent } from "@/lib/content/db";

export const dynamic = "force-dynamic";

/** Escape a value for an iCalendar text field. */
function esc(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** ICS timestamp (UTC): YYYYMMDDTHHMMSSZ. */
function icsUtc(dt: Date): string {
  return dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Downloadable calendar file (.ics) for the race day, built from the live
 * content. Race time is Brazil local (fixed −03:00, no DST since 2019), so we
 * convert to UTC by adding 3h. Linked from the "Dia da Corrida" band.
 */
export async function GET() {
  const c = await getSiteContent();
  const raceDate = c.inscricao?.raceDate;
  const m = raceDate?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) {
    return new Response("Data da corrida não definida.", { status: 404 });
  }

  const [, y, mo, d, h, min] = m.map(Number) as unknown as number[];
  const start = new Date(Date.UTC(y, mo - 1, d, h + 3, min)); // local −03:00 → UTC
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // default 2h

  const title = c.event?.brandName || "Run4BrasilAfrica";
  const location =
    c.location?.address?.trim() ||
    c.location?.venueName?.trim() ||
    c.event?.city ||
    "";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Run4BrasilAfrica//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:raceday-${start.getTime()}@run4brasilafrica.com.br`,
    `DTSTAMP:${icsUtc(new Date())}`,
    `DTSTART:${icsUtc(start)}`,
    `DTEND:${icsUtc(end)}`,
    `SUMMARY:${esc(title)}`,
    location ? `LOCATION:${esc(location)}` : "",
    `DESCRIPTION:${esc("Dia da corrida — " + title)}`,
    "URL:https://run4brasilafrica.com.br",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return new Response(lines.join("\r\n"), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'attachment; filename="run4brasilafrica.ics"',
      "cache-control": "no-store",
    },
  });
}

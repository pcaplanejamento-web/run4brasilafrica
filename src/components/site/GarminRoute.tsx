"use client";

/**
 * Public Garmin route/activity map via the Garmin Connect embed iframe.
 * Needs a PUBLIC Garmin activity/course. The `.route-embed` wrapper keeps it
 * full-width within the section.
 */
export default function GarminRoute({ url }: { url: string }) {
  return (
    <div className="route-embed">
      <iframe
        src={url}
        title="Percurso no Garmin"
        className="h-full w-full"
        loading="lazy"
        allowFullScreen
      />
    </div>
  );
}

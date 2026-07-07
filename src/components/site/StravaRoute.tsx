"use client";

import { useEffect, useRef, useState } from "react";
import { stravaRouteId } from "@/lib/content/percurso";

type EmbedType = "route" | "activity";

/**
 * Public Strava route map via the official embed. Accepts a direct route id /
 * `strava.com/routes/<id>` link (used as-is) OR a **short link**
 * (`strava.app.link/…`), which is resolved to the numeric id at runtime via
 * `/api/strava-resolve`. No API credentials/OAuth. The `.route-embed` wrapper +
 * global CSS force the injected iframe to fill the section width; a
 * MutationObserver enforces it too, since embed.js sets a fixed width.
 */
export default function StravaRoute({ stravaRef }: { stravaRef: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const direct = stravaRouteId(stravaRef); // numeric id / routes link → use as-is
  const isUrl = /^https?:\/\//i.test(stravaRef);
  const [resolved, setResolved] = useState<{ id: string; type: EmbedType } | null>(null);
  const [failed, setFailed] = useState(false);

  const id = direct ?? resolved?.id ?? null;
  const type: EmbedType = direct ? "route" : resolved?.type ?? "route";

  // Resolve short links (no numeric id) to a route/activity id via the API.
  useEffect(() => {
    if (direct) return; // nothing to resolve
    let alive = true;
    fetch(`/api/strava-resolve?url=${encodeURIComponent(stravaRef)}`)
      .then((r) => r.json())
      .then((data: { ok: boolean; id?: string; type?: EmbedType }) => {
        if (!alive) return;
        if (data.ok && data.id) {
          setResolved({ id: data.id, type: data.type === "activity" ? "activity" : "route" });
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [stravaRef, direct]);

  // Boot the embed script + keep the injected iframe full-width.
  useEffect(() => {
    if (!id) return;
    const SRC = "https://strava-embeds.com/embed.js";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    if (!existing) {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      document.body.appendChild(s);
    } else {
      const w = window as unknown as { __STRAVA_EMBED_BOOTSTRAP__?: () => void };
      w.__STRAVA_EMBED_BOOTSTRAP__?.();
    }

    const el = ref.current;
    if (!el) return;
    const enforce = () => {
      el.querySelectorAll("iframe").forEach((f) => {
        f.style.width = "100%";
        f.style.maxWidth = "100%";
        f.style.border = "0";
      });
    };
    enforce();
    const observer = new MutationObserver(enforce);
    observer.observe(el, { childList: true, subtree: true });
    const timer = setTimeout(enforce, 2000);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [id]);

  if (id) {
    return (
      <div ref={ref} className="route-embed">
        <div
          key={`${type}-${id}`}
          className="strava-embed-placeholder"
          data-embed-type={type}
          data-embed-id={id}
          data-style="standard"
          data-terrain="3d"
          data-render-full="false"
        />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center gap-4 p-6 text-center md:h-[440px]">
        <p className="max-w-[420px] text-[14px] text-muted-strong">
          Não foi possível carregar o mapa do Strava aqui.
        </p>
        {isUrl && (
          <a
            href={stravaRef}
            target="_blank"
            rel="noopener noreferrer"
            className="clip-cta-lg inline-block bg-gold px-7 py-4 text-[15px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5"
          >
            Ver rota no Strava
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-[360px] items-center justify-center md:h-[440px]">
      <span className="font-[monospace] text-[12px] text-muted">carregando mapa…</span>
    </div>
  );
}

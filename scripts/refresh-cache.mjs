// Post-deploy: warm the home so it regenerates from LIVE D1 (no cache wipe).
//
// A deploy uploads a BUILD-time prerender of the home to the Next incremental
// cache (KV), rendered with SEED content (there's no D1 at build). The home is
// ISR (`revalidate = 30`), so the first request after deploy serves that entry
// and triggers a background regeneration from live D1 — subsequent requests are
// live. Warming here plays that "first request" role, so real visitors get live
// content within seconds.
//
// We deliberately DO NOT bulk-delete the cache anymore: that was thousands of KV
// deletes per deploy, which exhausted Cloudflare KV's **daily delete quota**
// (free plan) — and that same quota is what the media library needs to delete
// images. Deleting nothing here keeps the delete budget for the ADM. Runs from
// `cf:deploy`.
const HOME = "https://run4brasilafrica.com.br/";

// Warm a few times with gaps so the background revalidation has time to finish
// (stale-while-revalidate: 1st hit serves stale + kicks off regen; later hits
// get the fresh copy). No KV writes/deletes are performed by warming.
try {
  for (let i = 0; i < 3; i++) {
    await fetch(HOME, { cache: "no-store" }).catch(() => {});
    if (i < 2) await new Promise((r) => setTimeout(r, 4000));
  }
  console.log("cache: home warmed (regenera do D1 vivo; sem apagar KV)");
} catch (e) {
  console.warn("cache: warm skipped:", e.message);
}

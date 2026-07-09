// Post-deploy: clear the Next incremental cache (KV) and warm the home.
//
// A deploy populates the KV incremental cache with the BUILD-time prerender of
// the home, which is rendered with SEED content (there's no D1 at build). Clearing
// the cache forces the next request to regenerate the home from LIVE D1, so the
// public site never shows seed content after a deploy. Runs from `cf:deploy`.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const NS = "d9400024cc83471d872950cf8af0cbfc"; // NEXT_INC_CACHE_KV
const HOME = "https://run4brasilafrica.com.br/";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

try {
  const keys = JSON.parse(sh(`npx wrangler kv key list --namespace-id ${NS} --remote`));
  if (Array.isArray(keys) && keys.length) {
    writeFileSync("/tmp/r4ba-cache-keys.json", JSON.stringify(keys.map((k) => k.name)));
    execSync(
      `npx wrangler kv bulk delete /tmp/r4ba-cache-keys.json --namespace-id ${NS} --remote --force`,
      { stdio: "inherit" },
    );
    console.log(`cache: cleared ${keys.length} entries`);
  } else {
    console.log("cache: nothing to clear");
  }
} catch (e) {
  console.warn("cache: clear skipped:", e.message);
}

// Warm the home twice so it regenerates from live D1 and re-caches.
try {
  await fetch(HOME);
  await new Promise((r) => setTimeout(r, 1500));
  await fetch(HOME);
  console.log("cache: home warmed");
} catch (e) {
  console.warn("cache: warm skipped:", e.message);
}

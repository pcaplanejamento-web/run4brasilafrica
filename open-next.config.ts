import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

// Adaptador OpenNext → Cloudflare Workers.
//
// Cache incremental em KV (binding NEXT_INC_CACHE_KV) + interceptação de cache:
// páginas ISR (ex.: a home com `revalidate`) são servidas do cache já pronto,
// sem re-renderizar a cada requisição. Isso corta o custo de CPU/memória em
// cold start — a causa do "Error 1102" intermitente na home dinâmica.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  enableCacheInterception: true,
});

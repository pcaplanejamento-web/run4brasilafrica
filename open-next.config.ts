import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Adaptador OpenNext → Cloudflare Workers. Config padrão é suficiente para este
// app (site + ADM + rota /api/content). Ver ARQUITETURA.md / README (Deploy).
export default defineCloudflareConfig();

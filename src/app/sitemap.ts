import type { MetadataRoute } from "next";

const BASE = "https://run4brasilafrica.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}

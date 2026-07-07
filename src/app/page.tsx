import { getSiteContent } from "@/lib/content/db";
import SiteContent from "@/components/site/SiteContent";

export const dynamic = "force-dynamic";

/**
 * Public home page. Renders the **live** content (ADM edits) on the server so the
 * first paint is already correct — colors, banner, images and components all come
 * from D1, no flash. `getSiteContent` is request-deduped with the layout.
 */
export default async function Home() {
  const initial = await getSiteContent();
  return <SiteContent initial={initial} />;
}

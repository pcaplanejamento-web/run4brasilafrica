import { getSiteContent } from "@/lib/content/db";
import SiteContent from "@/components/site/SiteContent";

// ISR: the home is rendered once and cached (KV incremental cache), then
// revalidated in the background at most every 30s. Cold isolates serve the
// cached HTML via cache interception instead of running the full SSR — which is
// what caused the intermittent "Error 1102" (resource limit) on cold start.
// ADM content edits appear within the window; a code deploy re-renders it.
export const revalidate = 30;

/**
 * Public home page. Renders the content (ADM edits) on the server so the first
 * paint is already correct — colors, banner, images and components all come from
 * D1, no flash. `getSiteContent` is request-deduped with the layout.
 */
export default async function Home() {
  const initial = await getSiteContent();
  return <SiteContent initial={initial} />;
}

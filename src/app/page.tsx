import { seedContent } from "@/lib/content/seed";
import { readContentAsync } from "@/lib/content/db";
import SiteContent from "@/components/site/SiteContent";

export const dynamic = "force-dynamic";

/**
 * Public home page. Renders the **live** content (ADM edits) already on the
 * server so the first paint is correct — no flash of placeholder/seed content.
 * Reads D1 through the OpenNext **async** binding (`readContentAsync`), which is
 * the supported way to access bindings during RSC render; falls back to the seed
 * if unavailable (e.g. `next dev`). `<SiteContent>` still re-checks on the client
 * to pick up any change made after this render.
 */
export default async function Home() {
  let initial = seedContent;
  try {
    const { content } = await readContentAsync();
    initial = content;
  } catch {
    /* keep seed */
  }
  return <SiteContent initial={initial} />;
}

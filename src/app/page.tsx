import { seedContent } from "@/lib/content/seed";
import SiteContent from "@/components/site/SiteContent";

/**
 * Public home page. Server-renders the baseline (seed) content for SEO and first
 * paint; the live content (ADM edits) is hydrated on the client from
 * /api/content inside <SiteContent>.
 */
export default function Home() {
  return <SiteContent initial={seedContent} />;
}

import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/site/SiteChrome";
import ImageProtection from "@/components/site/ImageProtection";
import { readContentAsync } from "@/lib/content/db";
import { seedContent } from "@/lib/content/seed";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * Metadata built from the LIVE content (Configurações) so the share card (title,
 * description) and the browser tab never diverge from what the ADM set. The OG
 * image is generated dynamically (see `opengraph-image.tsx`). Falls back to the
 * seed if the content read fails.
 */
export async function generateMetadata(): Promise<Metadata> {
  let event = seedContent.event;
  try {
    const { content } = await readContentAsync();
    event = content.event ?? event;
  } catch {
    /* keep seed */
  }

  const brand = event.brandName || "Run4BrasilAfrica";
  const headline = event.tagline || "Corra por algo maior";
  const title = `${brand} — ${headline}`;
  const where = event.dateLabel || event.city || "";
  const description = `Corrida de rua que conecta esporte e causa social entre o Brasil e a África.${
    where ? ` ${where}.` : ""
  } Inscrições abertas.`;
  const shortDescription = `Corrida de rua que conecta esporte e causa social entre o Brasil e a África.${
    where ? ` ${where}.` : ""
  }`;

  return {
    metadataBase: new URL("https://run4brasilafrica.com.br"),
    alternates: { canonical: "/" },
    title,
    description,
    keywords: [
      brand,
      "corrida de rua",
      ...(event.city ? [event.city] : []),
      "causa social",
      "Brasil África",
      "10km",
      "5km",
    ],
    openGraph: {
      title,
      description: shortDescription,
      url: "/",
      siteName: brand,
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: shortDescription,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} h-full`}
    >
      <body className="min-h-full">
        <SiteChrome />
        <ImageProtection />
        {/* Without JS the scroll-reveal observer never runs — force content
            visible so no-JS users and crawlers still see everything. */}
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}

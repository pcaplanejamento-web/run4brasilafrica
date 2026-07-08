import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import ImageProtection from "@/components/site/ImageProtection";
import { getSiteContent } from "@/lib/content/db";
import { themeCss } from "@/lib/content/theme";

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
  const content = await getSiteContent();
  const event = content.event;
  const favicon = content.branding?.favicon;

  const brand = event.brandName || "Run4BrasilAfrica";
  const ogImage = content.branding?.ogImage || "/og.png";
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
    ...(favicon ? { icons: { icon: favicon } } : {}),
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
      images: [{ url: ogImage, width: 1200, height: 630, alt: brand }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: shortDescription,
      images: [ogImage],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await getSiteContent();
  // Theme colors applied on the server → correct colors on the FIRST paint.
  const theme = themeCss(content.theme);
  // Preload the first hero image / the logo so they show up immediately.
  const firstSlide = content.hero?.slides?.[0];
  const heroImg =
    firstSlide?.mediaType === "image" && firstSlide.image ? firstSlide.image : null;
  const logo = content.branding?.logo;

  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} h-full`}
    >
      <head>
        {theme && <style id="r4ba-theme" dangerouslySetInnerHTML={{ __html: theme }} />}
        {heroImg && <link rel="preload" as="image" href={heroImg} fetchPriority="high" />}
        {logo && <link rel="preload" as="image" href={logo} />}
      </head>
      <body className="min-h-full">
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

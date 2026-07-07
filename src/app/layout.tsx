import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://run4brasilafrica.com.br"),
  alternates: { canonical: "/" },
  title: "Run4BrasilAfrica — Corra por algo maior",
  description:
    "Run4BrasilAfrica: corrida de rua que conecta esporte e causa social entre o Brasil e a África. 14 de setembro de 2026, Rio de Janeiro. Inscrições abertas.",
  keywords: [
    "Run4BrasilAfrica",
    "corrida de rua",
    "Rio de Janeiro",
    "causa social",
    "Brasil África",
    "10km",
    "5km",
  ],
  openGraph: {
    title: "Run4BrasilAfrica — Corra por algo maior",
    description:
      "Corrida de rua que conecta esporte e causa social entre o Brasil e a África. 14 de setembro de 2026, Rio de Janeiro.",
    locale: "pt_BR",
    type: "website",
  },
};

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

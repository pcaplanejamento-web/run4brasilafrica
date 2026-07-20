import Link from "next/link";
import type { ContactLinks } from "@/lib/content/types";

function ext(url?: string) {
  if (!url) return "#";
  return url.startsWith("http") ? url : `https://${url}`;
}

/** Footer with social links and the discreet ADM entry point. */
export default function SiteFooter({
  contact,
  logo,
}: {
  contact: ContactLinks;
  logo?: string;
}) {
  const socials = [
    { label: "Instagram", href: ext(contact.instagram) },
    { label: "WhatsApp", href: `https://wa.me/${(contact.whatsapp || "").replace(/\D/g, "")}` },
    { label: "YouTube", href: ext(contact.youtube) },
  ];

  return (
    <footer className="flex flex-col gap-8 bg-ink-deeper px-5 py-12 text-muted sm:px-8 md:flex-row md:items-center md:justify-between md:px-14 md:py-[60px]">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt="Run4BrasilAfrica"
          className="h-14 w-auto max-w-[160px] self-start object-contain md:h-11"
        />
      ) : (
        <div className="font-display text-[18px] uppercase text-white">
          Run4BrasilAfrica
        </div>
      )}

      <div className="flex flex-wrap gap-5 text-[13px] uppercase">
        {socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-cream"
          >
            {s.label}
          </a>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <span className="text-[12px] opacity-60">{contact.copyright}</span>
        <a
          href="#organizadores"
          className="border-l border-line-soft pl-4 text-[12px] text-muted transition-colors hover:text-cream"
        >
          Organizadores
        </a>
        <a
          href="#privacidade"
          className="border-l border-line-soft pl-4 text-[12px] text-muted transition-colors hover:text-cream"
        >
          Privacidade
        </a>
        <Link
          href="/admin/login"
          className="border-l border-line-soft pl-4 text-[12px] text-muted transition-colors hover:text-cream"
        >
          Acesso administrativo
        </Link>
      </div>
    </footer>
  );
}

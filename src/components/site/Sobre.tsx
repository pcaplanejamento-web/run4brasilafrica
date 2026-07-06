import type { AboutSection } from "@/lib/content/types";
import Reveal from "./Reveal";

/** "A causa" — the social mission, image + text, two columns on desktop. */
export default function Sobre({ about }: { about: AboutSection }) {
  return (
    <section
      id="sobre"
      className="grid grid-cols-1 items-center gap-10 px-5 py-20 sm:px-8 md:grid-cols-2 md:gap-16 md:px-14 md:pb-[90px] md:pt-[110px]"
    >
      <Reveal
        className="flex h-[260px] items-center justify-center md:h-[400px]"
        style={{
          background:
            "repeating-linear-gradient(70deg, oklch(0.45 0.06 145) 0 24px, oklch(0.4 0.06 143) 24px 48px)",
        }}
      >
        <span className="font-[monospace] text-[12px] text-white/70">
          [ foto: comunidade / causa social ]
        </span>
      </Reveal>

      <Reveal delay={120}>
        <div className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-gold">
          {about.eyebrow}
        </div>
        <h2 className="mb-[22px] font-display text-[32px] font-bold uppercase leading-[1.05] md:text-[42px]">
          {about.title}
        </h2>
        <p className="max-w-[460px] text-[16px] leading-[1.7] text-muted-strong">
          {about.body}
        </p>
        <a
          href="#parceiros"
          className="mt-6 inline-block text-[15px] font-bold uppercase text-gold transition-opacity hover:opacity-80"
        >
          → {about.linkLabel}
        </a>
      </Reveal>
    </section>
  );
}

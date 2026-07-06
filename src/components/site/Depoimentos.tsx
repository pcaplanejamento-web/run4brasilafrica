import type { Testimonial } from "@/lib/content/types";
import Reveal from "./Reveal";

/** Participant testimonials (Plano §4.1.6). */
export default function Depoimentos({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  return (
    <section className="px-5 py-20 sm:px-8 md:px-14 md:py-[100px]">
      <h2 className="mb-8 font-display text-[26px] font-bold uppercase md:mb-10 md:text-[32px]">
        Quem já correu
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-7">
        {testimonials.map((t, i) => (
          <Reveal
            key={t.name}
            delay={i * 100}
            className="border-t-[3px] border-gold bg-ink-card p-7"
          >
            <p className="mb-4 text-[18px] leading-[1.5]">&ldquo;{t.quote}&rdquo;</p>
            <div className="text-[14px] font-bold">{t.name}</div>
            <div className="text-[13px] opacity-65">{t.role}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

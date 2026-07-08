import type { Testimonial } from "@/lib/content/types";
import Reveal from "./Reveal";
import SectionEyebrow from "./SectionEyebrow";

/** Participant testimonials (Plano §4.1.6). */
export default function Depoimentos({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  return (
    <section className="px-5 py-20 sm:px-8 md:px-14 md:py-[100px]">
      <SectionEyebrow as="h2" className="mb-8 md:mb-10">
        Quem já correu
      </SectionEyebrow>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-7">
        {testimonials.map((t, i) => (
          <Reveal
            key={`${t.name}-${i}`}
            delay={i * 100}
            className="flex flex-col border-t-[3px] border-gold bg-ink-card p-7"
          >
            <p className="mb-5 flex-1 text-[18px] leading-[1.5]">&ldquo;{t.quote}&rdquo;</p>
            <div className="flex items-center gap-3">
              {t.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.photo}
                  alt={t.name}
                  draggable={false}
                  className="h-12 w-12 flex-none rounded-full object-cover"
                />
              )}
              <div className="min-w-0">
                <div className="text-[14px] font-bold">{t.name}</div>
                <div className="text-[13px] opacity-65">{t.role}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

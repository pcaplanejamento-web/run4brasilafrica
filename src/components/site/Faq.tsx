"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/content/types";
import SectionEyebrow from "./SectionEyebrow";

/**
 * FAQ accordion (Plano §4.1.6). One item open at a time; first open by default.
 * Keyboard- and touch-accessible via native <button> headers.
 */
export default function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="bg-ink-deep px-5 py-20 sm:px-8 md:px-14 md:py-[100px]">
      <SectionEyebrow as="h2" className="mb-8">
        Perguntas frequentes
      </SectionEyebrow>
      <div className="max-w-[820px]">
        {items.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="border-b border-line">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-[16px] font-semibold md:text-[17px]">
                  {f.q}
                </span>
                <span className="shrink-0 text-[20px] leading-none text-gold">
                  {isOpen ? "–" : "+"}
                </span>
              </button>
              {isOpen && (
                <div
                  id={`faq-panel-${i}`}
                  className="r4ba-fade max-w-[640px] pb-5 text-[15px] leading-[1.6] text-muted"
                >
                  {f.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

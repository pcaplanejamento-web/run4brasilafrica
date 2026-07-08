"use client";

import { useState } from "react";
import type { SejaParceiroSection, PartnerKind } from "@/lib/content/types";
import SectionEyebrow from "./SectionEyebrow";

const inputClass =
  "min-h-11 w-full rounded-lg border border-line bg-ink-panel px-3.5 text-[15px] text-cream outline-none transition-colors placeholder:text-muted focus:border-gold";

/**
 * "Seja um Parceiro" — a public form where a person or company signs up to
 * support the cause. Leads are stored in the site's own database
 * (`/api/partners`). Fully responsive; touch-friendly targets (min-h-11).
 */
export default function SejaParceiro({ config }: { config: SejaParceiroSection }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<PartnerKind>("fisica");
  const [hasWhatsapp, setHasWhatsapp] = useState(true);
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    try {
      const r = await fetch("/api/partners", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, phone, message, kind, hasWhatsapp }),
      });
      const d = (await r.json()) as { ok: boolean };
      setState(d.ok ? "ok" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <section id="seja-parceiro" className="bg-ink-deep px-5 py-16 sm:px-8 md:px-14 md:py-20">
      <SectionEyebrow as="h2">{config.title || "Seja um parceiro"}</SectionEyebrow>
      {config.subtitle?.trim() && (
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-cream/70 md:text-[16px]">
          {config.subtitle}
        </p>
      )}

      {state === "ok" ? (
        <div className="mt-8 max-w-[680px] rounded-xl border border-gold/40 bg-ink-panel p-6 text-cream">
          <div className="text-[17px] font-bold">Recebemos o seu cadastro!</div>
          <p className="mt-2 text-[15px] leading-relaxed text-cream/75">
            Obrigado por querer apoiar a causa. A organização vai analisar e entrar em contato em
            breve.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 max-w-[680px]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-cream/80">Nome</span>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={200}
                autoComplete="name"
                placeholder="Seu nome ou da empresa"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-cream/80">E-mail</span>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={200}
                autoComplete="email"
                placeholder="seu@email.com"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-cream/80">Telefone</span>
              <input
                type="tel"
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={40}
                autoComplete="tel"
                placeholder="(00) 00000-0000"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-cream/80">Você é</span>
              <select
                className={`${inputClass} py-2`}
                value={kind}
                onChange={(e) => setKind(e.target.value as PartnerKind)}
              >
                <option value="fisica">Pessoa física</option>
                <option value="juridica">Pessoa jurídica</option>
              </select>
            </label>
          </div>

          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-[14px] text-cream/85">
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0 accent-[var(--color-gold)]"
              checked={hasWhatsapp}
              onChange={(e) => setHasWhatsapp(e.target.checked)}
            />
            Este número tem WhatsApp
          </label>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-cream/80">O que posso ajudar</span>
            <textarea
              className={`${inputClass} min-h-[120px] resize-y py-3 leading-relaxed`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={2000}
              placeholder="Conte qual serviço, produto ou apoio você quer oferecer à causa."
            />
          </label>

          {state === "error" && (
            <p className="mt-3 text-[13px] font-semibold text-gold">
              Não foi possível enviar agora. Confira os dados e tente novamente.
            </p>
          )}

          <button
            type="submit"
            disabled={state === "loading"}
            className="clip-cta-lg mt-6 inline-block bg-gold px-7 py-4 text-[15px] font-bold uppercase text-gold-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {state === "loading" ? "Enviando…" : "Quero ser parceiro"}
          </button>
        </form>
      )}
    </section>
  );
}

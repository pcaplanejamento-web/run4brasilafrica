"use client";

import { useEffect, useRef, useState } from "react";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { normalizeCertCode } from "@/lib/results/verify";

interface Athlete {
  name: string;
  pos: number;
  bib?: string;
  category: string;
  timeNet?: string;
  timeGross?: string;
  team?: string;
  ageGroup?: string;
}
type Result =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "found"; athlete: Athlete }
  | { state: "notfound" }
  | { state: "error"; msg: string };

/**
 * Botão do rodapé + **banner flutuante** para verificar a autenticidade de um
 * certificado pelo código (`R4B-XXXXXX`). Consulta `/api/verify-cert` (recomputa
 * o código no servidor a partir dos resultados) e mostra os dados do atleta.
 * Autocontido; casca/scroll-lock/History igual aos demais modais do site.
 */
export default function VerifyCertificateModal({
  className,
  label = "Verificar certificado",
  onOpen,
}: {
  /** Classe do gatilho (permite reusar no rodapé, no header desktop e no menu). */
  className?: string;
  label?: string;
  /** Chamado ao abrir (ex.: fechar o menu do header). */
  onOpen?: () => void;
} = {}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [res, setRes] = useState<Result>({ state: "idle" });
  const pushed = useRef(false);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    if (!pushed.current) {
      try { window.history.pushState({ r4baVerify: true }, ""); pushed.current = true; } catch { pushed.current = false; }
    }
    const onPop = () => { if (window.history.state?.r4baVerify) return; pushed.current = false; setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key !== "Escape") return; if (pushed.current) window.history.back(); else setOpen(false); };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("popstate", onPop); window.removeEventListener("keydown", onKey); };
  }, [open]);

  const requestClose = () => { if (pushed.current) window.history.back(); else setOpen(false); };

  async function verify() {
    const c = normalizeCertCode(code);
    if (!c) { setRes({ state: "error", msg: "Digite um código válido (ex.: R4B-AB12CD)." }); return; }
    setRes({ state: "loading" });
    try {
      const r = await fetch(`/api/verify-cert?code=${encodeURIComponent(c)}`);
      const d = (await r.json()) as { ok: boolean; found?: boolean; athlete?: Athlete };
      if (d.ok && d.found && d.athlete) setRes({ state: "found", athlete: d.athlete });
      else if (d.ok) setRes({ state: "notfound" });
      else setRes({ state: "error", msg: "Verificação indisponível no momento." });
    } catch {
      setRes({ state: "error", msg: "Falha ao verificar. Tente novamente." });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { onOpen?.(); setRes({ state: "idle" }); setCode(""); setOpen(true); }}
        className={className || "text-[12px] text-muted transition-colors hover:text-cream"}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Verificar certificado"
        >
          <button type="button" aria-label="Fechar" onClick={requestClose} className="absolute inset-0 bg-black/70" />
          <div className="relative z-10 w-full border-line-soft bg-ink-panel p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] sm:max-w-[480px] sm:rounded-2xl sm:border sm:p-6">
            <div className="mb-1 flex items-start justify-between gap-3">
              <h2 className="font-display text-[18px] font-bold uppercase text-cream md:text-[20px]">Verificar certificado</h2>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Fechar"
                className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-cream transition-colors hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <p className="mb-3 text-[13px] text-muted">
              Digite o código de autenticação que aparece no rodapé do certificado.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") verify(); }}
                placeholder="R4B-XXXXXX"
                inputMode="text"
                autoCapitalize="characters"
                aria-label="Código do certificado"
                className="min-h-12 flex-1 rounded-lg border border-line bg-ink px-4 text-[15px] font-bold uppercase tracking-[0.06em] text-cream outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-muted focus:border-gold"
              />
              <button
                type="button"
                onClick={verify}
                disabled={res.state === "loading"}
                className="min-h-12 rounded-lg bg-gold px-6 text-[14px] font-bold text-gold-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {res.state === "loading" ? "Verificando…" : "Verificar"}
              </button>
            </div>

            {/* Resultado */}
            {res.state === "found" && (
              <div className="mt-4 rounded-lg border border-[#4a9d5f]/50 bg-[#4a9d5f]/10 p-4">
                <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.04em] text-[#7fd694]">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                  Certificado autêntico
                </div>
                <div className="mt-2 font-display text-[17px] font-bold uppercase text-cream">{res.athlete.name}</div>
                <div className="mt-1 text-[13px] text-muted-strong">
                  {res.athlete.pos}º lugar · {res.athlete.category}
                  {(res.athlete.timeNet || res.athlete.timeGross) ? ` · ${res.athlete.timeNet || res.athlete.timeGross}` : ""}
                </div>
              </div>
            )}
            {res.state === "notfound" && (
              <div className="mt-4 rounded-lg border border-[#c0392b]/50 bg-[#c0392b]/10 p-4 text-[13px] text-[#e6a29b]">
                Código não encontrado. Confira se digitou corretamente (o código está no rodapé do certificado).
              </div>
            )}
            {res.state === "error" && (
              <div className="mt-4 rounded-lg border border-[#c0392b]/50 bg-[#c0392b]/10 p-4 text-[13px] text-[#e6a29b]">{res.msg}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

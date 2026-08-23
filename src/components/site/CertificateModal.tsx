"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CertificateConfig, ClassificacaoDisplay, EventInfo, RaceResultRow } from "@/lib/content/types";
import { primaryTime } from "@/lib/results/format";
import { ensureFonts, loadImageTaintSafe } from "@/lib/results/card";
import {
  CERT_H,
  CERT_W,
  drawCertificate,
  type CertificateData,
} from "@/lib/results/certificate";
import { A4_LANDSCAPE_PT, canvasToPdfBlob } from "@/lib/pdf";
import { certSeed, certVerifyCode } from "@/lib/results/verify";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}
/** "RIO DE JANEIRO" → "Rio de Janeiro" (título; mantém preposições curtas em minúsculo). */
function titleCase(s: string): string {
  const small = new Set(["de", "da", "do", "das", "dos", "e"]);
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * **Certificado** do atleta (modal): desenha um certificado A4 paisagem moderno
 * num `<canvas>` (WYSIWYG) e permite **baixar em PDF** (gerador próprio, sem
 * dependências) ou compartilhar no celular. Mesma casca/History/scroll-lock dos
 * outros modais do site. 100% no navegador.
 */
/** Cor dominante (mais vívida) da logo — para tingir o certificado com a marca. */
function dominantColor(img: HTMLImageElement | null): string | undefined {
  if (!img || !img.width) return undefined;
  try {
    const s = 48;
    const cv = document.createElement("canvas");
    cv.width = s; cv.height = s;
    const cx = cv.getContext("2d", { willReadFrequently: true });
    if (!cx) return undefined;
    cx.drawImage(img, 0, 0, s, s);
    const { data } = cx.getImageData(0, 0, s, s);
    const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const light = (max + min) / 2;
      if (light > 242 || light < 22) continue; // pula branco/preto
      if ((max === 0 ? 0 : (max - min) / max) < 0.18) continue; // pula cinza
      const key = Math.round(r / 32) * 100 + Math.round(g / 32) * 10 + Math.round(b / 32);
      const cur = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
      cur.n++; cur.r += r; cur.g += g; cur.b += b;
      buckets.set(key, cur);
    }
    let best = { score: -1, r: 0, g: 0, b: 0 };
    for (const c of buckets.values()) {
      const r = c.r / c.n, g = c.g / c.n, b = c.b / c.n;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const score = c.n * (0.4 + sat);
      if (score > best.score) best = { score, r, g, b };
    }
    if (best.score < 0) return undefined;
    let { r, g, b } = best;
    if (0.299 * r + 0.587 * g + 0.114 * b > 185) { r *= 0.72; g *= 0.72; b *= 0.72; } // escurece p/ legibilidade sobre creme
    const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
    return `#${h(r)}${h(g)}${h(b)}`;
  } catch {
    return undefined;
  }
}

export default function CertificateModal({
  runner,
  event,
  categoryLabel,
  categoryDistance,
  brandLogo,
  display,
  certificate,
  onClose,
}: {
  runner: RaceResultRow | null;
  event?: EventInfo;
  categoryLabel: string;
  categoryDistance?: string;
  brandLogo?: string;
  display?: ClassificacaoDisplay;
  certificate?: CertificateConfig;
  onClose: () => void;
}) {
  const open = !!runner;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const domainRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const pushed = useRef(false);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [coarse] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches);

  // History API + Esc (idêntico ao RunnerModal — Voltar do aparelho fecha isto).
  useEffect(() => {
    if (!open) return;
    if (!pushed.current) {
      try { window.history.pushState({ r4baCert: true }, ""); pushed.current = true; } catch { pushed.current = false; }
    }
    const onPop = () => { if (window.history.state?.r4baCert) return; pushed.current = false; onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key !== "Escape") return; if (pushed.current) window.history.back(); else onClose(); };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("popstate", onPop); window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
  useBodyScrollLock(open);

  useEffect(() => { ensureFonts().then(() => setFontsReady(true)); }, []);
  useEffect(() => { loadImageTaintSafe(certificate?.logo || brandLogo).then(setLogo); }, [certificate?.logo, brandLogo]);
  useEffect(() => {
    if (!certificate?.bgImage) { setBgImg(null); return; }
    loadImageTaintSafe(certificate.bgImage).then(setBgImg);
  }, [certificate?.bgImage]);

  const data: CertificateData | null = useMemo(() => {
    if (!runner) return null;
    const time = primaryTime(runner, display);
    const timeLabel = time && time === runner.timeNet ? "Tempo líquido" : time ? "Tempo bruto" : "Tempo";
    // dateLabel: "14 SET 2026 · RIO DE JANEIRO" → data + cidade.
    const parts = (event?.dateLabel || "").split("·").map((s) => s.trim()).filter(Boolean);
    const dateText = parts[0] || undefined;
    const cityRaw = parts[1] || event?.city || "";
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return {
      name: runner.name,
      bib: runner.bib,
      pos: runner.pos,
      time,
      timeLabel,
      modality: runner.modality,
      categoryLabel,
      distance: categoryDistance,
      ageGroup: runner.ageGroup,
      ageGroupPos: runner.ageGroupPos,
      team: display?.team ? runner.team : undefined,
      eventName: event?.brandName || "",
      editionYear: event?.editionYear,
      dateText,
      cityText: cityRaw ? titleCase(cityRaw) : undefined,
      siteUrl: typeof window !== "undefined" ? window.location.host : undefined,
      issuedText: `Emitido em ${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear()}`,
      verifyCode: certVerifyCode(certSeed(runner, categoryLabel)),
      // ADM: cor da marca (accent explícito, senão amostra a logo), rótulos e toggles.
      accent:
        certificate?.accent?.trim() ||
        (certificate?.useLogoColors !== false ? dominantColor(logo) : undefined),
      bgColor: certificate?.bgColor,
      textColor: certificate?.textColor,
      scaleTitle: certificate?.scaleTitle,
      scaleName: certificate?.scaleName,
      scaleBody: certificate?.scaleBody,
      scaleLogo: certificate?.scaleLogo,
      showEventName: certificate?.showEventName,
      message: certificate?.message,
      signMode: certificate?.signMode,
      sig1Label: certificate?.sig1Label,
      sig1Name: certificate?.sig1Name,
      sig1Cpf: certificate?.sig1Cpf,
      sig2Label: certificate?.sig2Label,
      sig2Name: certificate?.sig2Name,
      sig2Cpf: certificate?.sig2Cpf,
      showBib: certificate?.showBib,
      showTime: certificate?.showTime,
      showAgeGroup: certificate?.showAgeGroup,
      showTeam: certificate?.showTeam,
      domainBold: certificate?.domainBold,
      issuedBold: certificate?.issuedBold,
      authBold: certificate?.authBold,
    };
  }, [runner, event, categoryLabel, categoryDistance, display, certificate, logo]);

  // Desenha o certificado quando tudo está pronto.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !data) return;
    c.width = CERT_W;
    c.height = CERT_H;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    try { domainRectRef.current = drawCertificate(ctx, CERT_W, CERT_H, data, { logo, bg: bgImg }).domainRect; }
    catch (e) { console.error("[certificado] erro ao desenhar:", e); }
  }, [data, logo, bgImg, fontsReady]);

  if (!runner || !data) return null;

  const requestClose = () => { if (pushed.current) window.history.back(); else onClose(); };

  async function download() {
    const c = canvasRef.current;
    if (!c) return;
    setBusy(true);
    try {
      // Link clicável no domínio do rodapé → abre o site.
      const r = domainRectRef.current;
      const links = r && typeof window !== "undefined"
        ? [{ ...r, url: window.location.origin }]
        : undefined;
      const blob = await canvasToPdfBlob(c, A4_LANDSCAPE_PT, 0.95, links);
      if (!blob) return;
      const filename = `certificado-${slug(runner!.name)}.pdf`;
      const file = new File([blob], filename, { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (coarse && typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
        try { await nav.share({ files: [file], title: "Meu certificado" }); return; }
        catch (e) { if (e instanceof DOMException && e.name === "AbortError") return; /* senão baixa */ }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function downloadImage() {
    const c = canvasRef.current;
    if (!c) return;
    setBusy(true);
    try {
      const blob: Blob | null = await new Promise((res) => c.toBlob((b) => res(b), "image/png"));
      if (!blob) return;
      const filename = `certificado-${slug(runner!.name)}.png`;
      const file = new File([blob], filename, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (coarse && typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
        try { await nav.share({ files: [file], title: "Meu certificado" }); return; }
        catch (e) { if (e instanceof DOMException && e.name === "AbortError") return; /* senão baixa */ }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Certificado de ${runner.name}`}
    >
      <button type="button" aria-label="Fechar" onClick={requestClose} className="absolute inset-0 hidden bg-black/75 sm:block" />
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-ink-panel sm:h-auto sm:max-h-[92vh] sm:max-w-[900px] sm:rounded-2xl sm:border sm:border-line-soft sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
        {/* Cabeçalho */}
        <div className="flex items-center gap-2 border-b border-line-soft px-3 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={requestClose}
            aria-label="Voltar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream transition-colors hover:bg-white/10 sm:hidden"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] uppercase tracking-[0.06em] text-gold">Certificado{categoryLabel ? ` · ${categoryLabel}` : ""}</div>
            <h2 className="mt-0.5 truncate font-display text-[18px] font-bold uppercase text-cream md:text-[20px]">{runner.name}</h2>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Fechar"
            className="hidden h-10 w-10 shrink-0 place-items-center rounded-full text-cream transition-colors hover:bg-white/10 sm:grid"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {/* Preview + ação */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-[760px]">
            <div className="overflow-hidden rounded-lg border border-line-soft bg-white shadow-lg">
              <canvas
                ref={canvasRef}
                className="block w-full"
                style={{ aspectRatio: `${CERT_W} / ${CERT_H}` }}
                aria-label={`Certificado de ${runner.name}`}
              />
            </div>
            <p className="mt-2 text-center text-[12px] text-muted">Certificado A4 (paisagem) · {coarse ? "toque em salvar para compartilhar/baixar" : "PDF pronto para impressão"}</p>

            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={download}
                disabled={busy}
                className="min-h-12 rounded-lg bg-gold px-8 text-[14px] font-bold text-gold-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {busy ? "Gerando…" : coarse ? "Salvar / Compartilhar PDF" : "Baixar certificado (PDF)"}
              </button>
              <button
                type="button"
                onClick={downloadImage}
                disabled={busy}
                className="min-h-12 rounded-lg border border-line-soft bg-white/5 px-8 text-[14px] font-bold text-cream transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {coarse ? "Salvar / Compartilhar imagem" : "Baixar imagem (PNG)"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

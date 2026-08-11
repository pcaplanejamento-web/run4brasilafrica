"use client";

import { useEffect, useRef, useState } from "react";
import type { EventInfo, RaceResultRow } from "@/lib/content/types";

/** Campos mostrados no detalhe (todos os disponíveis, com rótulo pt-BR). */
function detailFields(row: RaceResultRow): { label: string; value: string }[] {
  const f: { label: string; value?: string }[] = [
    { label: "Colocação geral", value: `${row.pos}º` },
    { label: "Número", value: row.bib },
    { label: "Tempo líquido", value: row.timeNet },
    { label: "Tempo bruto", value: row.timeGross },
    { label: "Equipe", value: row.team },
    { label: "Modalidade", value: row.modality },
    { label: "Categoria", value: row.category },
    { label: "Sexo", value: row.sex },
    { label: "Idade", value: row.age ? `${row.age}` : undefined },
    { label: "Faixa etária", value: row.ageGroup },
    { label: "Colocação na faixa", value: row.ageGroupPos ? `${row.ageGroupPos}º` : undefined },
  ];
  return f.filter((x): x is { label: string; value: string } => !!x.value);
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/**
 * Detalhe de um corredor + **gerador de imagem** (100% no navegador): o usuário
 * escolhe uma foto e o app "cola" os dados da corrida sobre ela num `<canvas>`;
 * dá para **baixar** e **compartilhar** (Web Share nativo com o arquivo, ou
 * WhatsApp). Nada é enviado ao servidor. Mesma casca dark dos modais do site.
 */
export default function RunnerModal({
  runner,
  onClose,
  event,
  categoryLabel,
}: {
  runner: RaceResultRow | null;
  onClose: () => void;
  event?: EventInfo;
  categoryLabel: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = !!runner;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Limpa o preview ao trocar de corredor / fechar (evita vazar objectURL).
  useEffect(() => {
    return () => {
      setImgUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return null;
      });
    };
  }, [runner]);

  if (!runner) return null;

  const fields = detailFields(runner);
  const brand = event?.brandName?.trim() || "";
  const year = event?.editionYear?.trim() || "";

  async function handlePhoto(file: File) {
    setError(null);
    setBusy(true);
    try {
      const out = await composeResultImage(file, runner!, { brand, year, categoryLabel });
      setImgUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(out);
      });
      setBlob(out);
    } catch {
      setError("Não foi possível gerar a imagem. Tente outra foto.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resultado-${slug(runner!.name)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function share() {
    if (!blob) return;
    const file = new File([blob], `resultado-${slug(runner!.name)}.png`, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: "Meu resultado", text: `${runner!.name} — ${runner!.pos}º lugar` });
        return;
      } catch {
        /* usuário cancelou ou não suportado → cai no fallback */
      }
    }
    // Fallback: baixa e abre o WhatsApp com o texto.
    download();
    const txt = encodeURIComponent(`Corri o ${brand}! ${runner!.name} — ${runner!.pos}º lugar (${categoryLabel}).`);
    window.open(`https://wa.me/?text=${txt}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Resultado de ${runner.name}`}
    >
      <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-line-soft bg-ink-panel shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="text-[12px] uppercase tracking-[0.06em] text-gold">
              {runner.pos}º lugar{categoryLabel ? ` · ${categoryLabel}` : ""}
            </div>
            <h2 className="mt-0.5 truncate font-display text-[19px] font-bold uppercase text-cream md:text-[22px]">
              {runner.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream transition-colors hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {/* Dados completos. */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {fields.map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="text-[11px] uppercase tracking-[0.05em] text-muted">{f.label}</dt>
                <dd className="truncate text-[15px] font-bold text-cream">{f.value}</dd>
              </div>
            ))}
          </dl>

          {/* Gerador de imagem. */}
          <div className="mt-6 rounded-xl border border-line-soft bg-ink p-4">
            <div className="text-[13px] font-bold uppercase tracking-[0.04em] text-cream">
              Sua foto com os dados
            </div>
            <p className="mt-1 text-[12px] text-muted">
              Escolha uma foto sua — os dados da corrida são &ldquo;colados&rdquo; na imagem, aqui no
              seu aparelho. Nada é enviado para a internet.
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhoto(f);
                e.target.value = "";
              }}
            />

            {imgUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt={`Resultado de ${runner.name}`}
                className="mt-3 w-full rounded-lg border border-line-soft"
              />
            )}
            {error && <div className="mt-2 text-[12px] text-[#ff8a7a]">{error}</div>}

            <div className="mt-3 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="min-h-11 rounded-lg border border-line-soft bg-ink-panel px-4 text-[13px] font-bold text-cream transition-colors hover:border-gold disabled:opacity-60"
              >
                {busy ? "Gerando…" : imgUrl ? "Trocar foto" : "Escolher foto"}
              </button>
              {blob && (
                <>
                  <button
                    type="button"
                    onClick={download}
                    className="min-h-11 rounded-lg bg-gold px-4 text-[13px] font-bold text-gold-ink transition-transform hover:-translate-y-0.5"
                  >
                    Baixar imagem
                  </button>
                  <button
                    type="button"
                    onClick={share}
                    className="min-h-11 rounded-lg border border-gold px-4 text-[13px] font-bold text-gold transition-colors hover:bg-gold hover:text-gold-ink"
                  >
                    Compartilhar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------- */
/* Composição da imagem (canvas) — sem upload.                                 */
/* --------------------------------------------------------------------------- */

interface Brand {
  brand: string;
  year: string;
  categoryLabel: string;
}

/** Desenha a foto (cobrindo) + faixa escura + dados da corrida e devolve um PNG. */
async function composeResultImage(file: File, row: RaceResultRow, b: Brand): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-2d");

  // Fonte do site quando já carregada (next/font) — senão cai no system-ui.
  try {
    await document.fonts?.ready;
  } catch {
    /* segue com a fonte de fallback */
  }
  const display = `'Space Grotesk', system-ui, -apple-system, Arial, sans-serif`;

  // Foto cobrindo todo o quadro (center-crop).
  const bmp = await createImageBitmap(file);
  const scale = Math.max(W / bmp.width, H / bmp.height);
  const dw = bmp.width * scale;
  const dh = bmp.height * scale;
  ctx.drawImage(bmp, (W - dw) / 2, (H - dh) / 2, dw, dh);
  bmp.close?.();

  // Gradiente escuro na parte de baixo para o texto respirar.
  const grad = ctx.createLinearGradient(0, H * 0.42, 0, H);
  grad.addColorStop(0, "rgba(10,8,4,0)");
  grad.addColorStop(0.55, "rgba(10,8,4,0.72)");
  grad.addColorStop(1, "rgba(10,8,4,0.95)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, H * 0.42, W, H * 0.58);

  const gold = "#c8ce2e";
  const pad = 72;

  // Marca no topo.
  if (b.brand) {
    ctx.font = `700 34px ${display}`;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 12;
    ctx.fillText(`${b.brand}${b.year ? " " + b.year : ""}`.toUpperCase(), pad, 80);
    ctx.shadowBlur = 0;
  }

  // Bloco de dados (de cima p/ baixo a partir de y0).
  let y = H - 470;
  ctx.textBaseline = "top";

  // Régua dourada.
  ctx.fillStyle = gold;
  ctx.fillRect(pad, y, 96, 8);
  y += 34;

  // Categoria + modalidade.
  const catLine = [b.categoryLabel, row.modality].filter(Boolean).join(" · ").toUpperCase();
  if (catLine) {
    ctx.font = `700 30px ${display}`;
    ctx.fillStyle = gold;
    ctx.fillText(catLine, pad, y);
    y += 46;
  }

  // Nome (até 2 linhas).
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 60px ${display}`;
  const nameLines = wrapText(ctx, row.name.toUpperCase(), W - pad * 2, 2);
  for (const line of nameLines) {
    ctx.fillText(line, pad, y);
    y += 66;
  }
  y += 18;

  // Colocação + tempo (na mesma linha).
  ctx.font = `700 92px ${display}`;
  ctx.fillStyle = gold;
  const posText = `${row.pos}º`;
  ctx.fillText(posText, pad, y);
  const posW = ctx.measureText(posText).width;
  const time = row.timeNet || row.timeGross;
  if (time) {
    ctx.font = `700 64px ${display}`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(time, pad + posW + 40, y + 24);
  }
  y += 108;

  // Sublinha (peito · faixa etária).
  const sub = [row.bib ? `Nº ${row.bib}` : "", row.ageGroup ?? "", row.team ?? ""]
    .filter(Boolean)
    .join("  ·  ");
  if (sub) {
    ctx.font = `500 30px ${display}`;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(sub, pad, y);
  }

  const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png", 0.95));
  if (!out) throw new Error("no-blob");
  return out;
}

/** Quebra o texto em até `maxLines` (última com reticências se estourar). */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const test = cur ? `${cur} ${w}` : w;
    if (!cur || ctx.measureText(test).width <= maxWidth) {
      cur = test;
    } else {
      lines.push(cur);
      // Na última linha permitida, joga todo o resto e para (será truncado abaixo).
      if (lines.length === maxLines - 1) {
        cur = words.slice(i).join(" ");
        break;
      }
      cur = w;
    }
  }
  if (lines.length < maxLines) lines.push(cur);

  // Reticências na última linha, se ainda estourar a largura.
  const li = Math.min(lines.length, maxLines) - 1;
  if (li >= 0 && ctx.measureText(lines[li]).width > maxWidth) {
    let last = lines[li];
    while (last.length > 1 && ctx.measureText(last + "…").width > maxWidth) last = last.slice(0, -1);
    lines[li] = last + "…";
  }
  return lines.slice(0, maxLines);
}

/**
 * Desenho (sem React) do **certificado** do atleta num `<canvas>` A4 paisagem.
 * Design moderno e profissional: moldura dupla, marca, título, corpo em serifa,
 * bloco de dados, **selo** e linhas de assinatura. WYSIWYG: o mesmo desenho serve
 * para o preview e para o PDF (o PDF embute o JPEG deste canvas).
 */

import { wrapText } from "./card";

/** Proporção A4 paisagem em px (≈300 DPI): 297mm × 210mm. */
export const CERT_W = 3508;
export const CERT_H = 2480;

const DISPLAY = `'Space Grotesk', system-ui, -apple-system, Arial, sans-serif`;
const SERIF = `Georgia, 'Times New Roman', 'Playfair Display', serif`;

const COL = {
  bg: "#faf8f2",
  bgEdge: "#f2eee2",
  ink: "#1b1712",
  soft: "#6c6455",
  line: "#d9d2c0",
  accent: "#7c8a1e", // verde-oliva (marca, legível sobre creme)
  accentSoft: "#aeb42a",
  gold: "#b08d2b",
};

export interface CertificateData {
  name: string;
  bib?: string;
  pos: number;
  time?: string; // tempo oficial (líquido/bruto) já escolhido
  timeLabel?: string; // "Tempo líquido" | "Tempo bruto"
  modality?: string; // "5KM"
  categoryLabel?: string; // "5KM MASCULINO"
  ageGroup?: string;
  ageGroupPos?: string;
  team?: string;
  eventName: string;
  editionYear?: string;
  dateText?: string; // "14 de setembro de 2026" (ou o que vier do dateLabel)
  cityText?: string; // "Rio de Janeiro"
  siteUrl?: string; // "run4brasilafrica..."
  issuedText?: string; // "Emitido em 13/08/2026"
  verifyCode?: string; // código curto de autenticidade
}

export interface CertificateAssets {
  logo: HTMLImageElement | null;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Escolhe o maior tamanho de fonte (≤ `startPx`) que faz o texto caber em `maxW`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, startPx: number, minPx: number, font: (px: number) => string, maxW: number): number {
  let px = startPx;
  while (px > minPx) {
    ctx.font = font(px);
    if (ctx.measureText(text).width <= maxW) break;
    px -= 2;
  }
  return px;
}

/** Selo circular (anel + laurel + colocação/“concluído”). */
function drawSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, pos: number) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Anel externo + interno.
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.lineWidth = r * 0.06; ctx.strokeStyle = COL.accent; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.lineWidth = r * 0.02; ctx.strokeStyle = COL.accentSoft; ctx.stroke();

  // Serrilhado do selo (raios curtos).
  const teeth = 40;
  ctx.strokeStyle = COL.accent;
  ctx.lineWidth = r * 0.018;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const r1 = r * 1.0, r2 = r * 1.06;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }

  // Estrela de 5 pontas no topo do selo.
  const star = (scx: number, scy: number, rr: number) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? rr : rr * 0.45;
      const px = scx + Math.cos(ang) * rad;
      const py = scy + Math.sin(ang) * rad;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = COL.accentSoft;
    ctx.fill();
  };
  star(cx, cy - r * 0.42, r * 0.2);

  // Texto central: colocação + rótulo.
  ctx.fillStyle = COL.ink;
  ctx.font = `800 ${Math.round(r * 0.58)}px ${DISPLAY}`;
  ctx.fillText(`${pos}º`, cx, cy + r * 0.06);
  ctx.fillStyle = COL.accent;
  ctx.font = `700 ${Math.round(r * 0.15)}px ${DISPLAY}`;
  ctx.fillText("COLOCAÇÃO", cx, cy + r * 0.46);
  ctx.restore();
}

/** Marca (logo do evento centrada, ou nome do evento em texto). */
function drawBrand(ctx: CanvasRenderingContext2D, assets: CertificateAssets, data: CertificateData, cx: number, top: number, h: number) {
  if (assets.logo && assets.logo.width > 0) {
    const w = (assets.logo.width / assets.logo.height) * h;
    const maxW = CERT_W * 0.34;
    const dw = Math.min(w, maxW);
    const dh = (dw / w) * h;
    ctx.drawImage(assets.logo, cx - dw / 2, top, dw, dh);
    return top + dh;
  }
  ctx.textAlign = "center";
  ctx.fillStyle = COL.ink;
  ctx.font = `800 ${Math.round(h * 0.9)}px ${DISPLAY}`;
  ctx.fillText((data.eventName || "").toUpperCase(), cx, top + h * 0.9);
  return top + h;
}

/** Desenha o certificado inteiro. */
export function drawCertificate(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  data: CertificateData,
  assets: CertificateAssets,
) {
  const cx = W / 2;
  ctx.textBaseline = "alphabetic";

  // ---- Fundo (creme com leve vinheta) ----
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(120,110,80,0.05)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // ---- Moldura dupla + cantos ----
  const m = 96;
  ctx.strokeStyle = COL.ink;
  ctx.lineWidth = 6;
  ctx.strokeRect(m, m, W - m * 2, H - m * 2);
  const m2 = m + 26;
  ctx.strokeStyle = COL.accentSoft;
  ctx.lineWidth = 3;
  ctx.strokeRect(m2, m2, W - m2 * 2, H - m2 * 2);
  // Cantos (pequenos “L” na cor da marca).
  const corner = 70;
  ctx.strokeStyle = COL.accent;
  ctx.lineWidth = 8;
  const drawCorner = (x: number, y: number, sx: number, sy: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + sy * corner);
    ctx.lineTo(x, y);
    ctx.lineTo(x + sx * corner, y);
    ctx.stroke();
  };
  drawCorner(m2 + 14, m2 + 14, 1, 1);
  drawCorner(W - m2 - 14, m2 + 14, -1, 1);
  drawCorner(m2 + 14, H - m2 - 14, 1, -1);
  drawCorner(W - m2 - 14, H - m2 - 14, -1, -1);

  const innerW = W - m2 * 2 - 160; // largura útil para texto
  let y = m2 + 120;

  // ---- Marca ----
  const brandBottom = drawBrand(ctx, assets, data, cx, y, 150);
  y = brandBottom + 40;

  // Eyebrow (evento + edição)
  ctx.textAlign = "center";
  ctx.fillStyle = COL.soft;
  ctx.font = `700 40px ${DISPLAY}`;
  const eyebrow = [data.eventName, data.editionYear].filter(Boolean).join(" · ").toUpperCase();
  if (eyebrow && (assets.logo?.width ?? 0) > 0) { ctx.fillText(eyebrow, cx, y); y += 60; }

  // ---- Título ----
  y += 30;
  ctx.fillStyle = COL.ink;
  const titlePx = 190;
  ctx.font = `800 ${titlePx}px ${DISPLAY}`;
  ctx.fillText("CERTIFICADO", cx, y + titlePx * 0.5);
  y += titlePx * 0.62;
  // Rótulo do tipo + filetes laterais.
  ctx.fillStyle = COL.accent;
  ctx.font = `700 46px ${DISPLAY}`;
  const sub = "DE CONCLUSÃO";
  y += 70;
  const subW = ctx.measureText(sub).width;
  ctx.fillText(sub, cx, y);
  ctx.strokeStyle = COL.accentSoft;
  ctx.lineWidth = 3;
  const ry = y - 16;
  ctx.beginPath(); ctx.moveTo(cx - subW / 2 - 120, ry); ctx.lineTo(cx - subW / 2 - 40, ry); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + subW / 2 + 40, ry); ctx.lineTo(cx + subW / 2 + 120, ry); ctx.stroke();
  y += 90;

  // ---- Corpo ----
  ctx.fillStyle = COL.soft;
  ctx.font = `italic 48px ${SERIF}`;
  ctx.fillText("Certificamos que", cx, y);
  y += 130;

  // Nome (serifa, grande, auto-ajustável)
  const name = (data.name || "").trim();
  const namePx = fitFont(ctx, name, 150, 64, (px) => `700 ${px}px ${SERIF}`, innerW);
  ctx.font = `700 ${namePx}px ${SERIF}`;
  ctx.fillStyle = COL.ink;
  ctx.fillText(name, cx, y);
  // Filete sob o nome
  const nameW = Math.min(ctx.measureText(name).width, innerW);
  ctx.strokeStyle = COL.accentSoft;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx - nameW / 2 - 30, y + 34); ctx.lineTo(cx + nameW / 2 + 30, y + 34); ctx.stroke();
  y += 130;

  // Prosa
  const distance = (data.modality || data.categoryLabel || "").trim();
  const place = `${data.pos}ª colocação geral`;
  const faixa = data.ageGroup && data.ageGroupPos && data.ageGroupPos !== "-"
    ? `, e ${data.ageGroupPos}ª colocação na faixa ${data.ageGroup}`
    : "";
  const local = [data.cityText, data.dateText].filter(Boolean).join(", ");
  const prova = distance ? `a prova de ${distance}` : "a prova";
  const evento = `${data.eventName}${data.editionYear ? ` ${data.editionYear}` : ""}`.trim();
  let prose = `concluiu com êxito ${prova} da ${evento}`;
  if (local) prose += `, realizada em ${local}`;
  if (data.time) prose += `, com o tempo de ${data.time}`;
  prose += `, alcançando a ${place}${faixa}.`;

  ctx.fillStyle = COL.ink;
  ctx.font = `400 46px ${SERIF}`;
  for (const line of wrapText(ctx, prose, innerW, 3)) {
    ctx.fillText(line, cx, y);
    y += 66;
  }

  // ---- Bloco de dados ----
  y += 60;
  const stats: { label: string; value: string }[] = [];
  if (data.bib) stats.push({ label: "Número", value: `#${data.bib}` });
  if (data.time) stats.push({ label: (data.timeLabel || "Tempo"), value: data.time });
  if (data.ageGroup) stats.push({ label: "Faixa etária", value: data.ageGroup });
  if (data.team) stats.push({ label: "Equipe", value: data.team });
  if (stats.length) {
    const boxW = 620, boxH = 150, gap = 40;
    const totalW = stats.length * boxW + (stats.length - 1) * gap;
    let bx = cx - totalW / 2;
    for (const s of stats) {
      roundRect(ctx, bx, y, boxW, boxH, 20);
      ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = COL.line; ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = COL.soft;
      ctx.font = `700 26px ${DISPLAY}`;
      ctx.fillText(s.label.toUpperCase(), bx + boxW / 2, y + 52);
      ctx.fillStyle = COL.ink;
      const vPx = fitFont(ctx, s.value, 54, 30, (px) => `800 ${px}px ${DISPLAY}`, boxW - 60);
      ctx.font = `800 ${vPx}px ${DISPLAY}`;
      ctx.fillText(s.value, bx + boxW / 2, y + 116);
      bx += boxW + gap;
    }
  }

  // ---- Selo (direita) ----
  const sealR = 210;
  const sealCx = W - m2 - 120 - sealR;
  const sealCy = H - m2 - 120 - sealR;
  drawSeal(ctx, sealCx, sealCy, sealR, data.pos);

  // ---- Assinaturas (esquerda + centro) ----
  const sigY = H - m2 - 220;
  const sigW = 620;
  const drawSig = (centerX: number, label: string, sub: string) => {
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(centerX - sigW / 2, sigY); ctx.lineTo(centerX + sigW / 2, sigY); ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = COL.ink; ctx.font = `700 34px ${DISPLAY}`;
    ctx.fillText(label.toUpperCase(), centerX, sigY + 52);
    if (sub) { ctx.fillStyle = COL.soft; ctx.font = `400 30px ${SERIF}`; ctx.fillText(sub, centerX, sigY + 96); }
  };
  const sigLeft = m2 + 120 + sigW / 2;
  const sigMid = sigLeft + sigW + 160;
  drawSig(sigLeft, "Organização", data.eventName);
  drawSig(sigMid, "Direção de Prova", "Cronometragem oficial");

  // ---- Rodapé (site + emissão + código) ----
  ctx.textAlign = "center";
  ctx.fillStyle = COL.soft;
  ctx.font = `400 30px ${DISPLAY}`;
  const footer = [data.siteUrl, data.issuedText, data.verifyCode ? `Autenticação ${data.verifyCode}` : ""]
    .filter(Boolean)
    .join("   ·   ");
  if (footer) ctx.fillText(footer, cx, H - m2 - 44);

  ctx.textAlign = "left";
}

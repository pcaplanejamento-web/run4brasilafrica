/**
 * Desenho (sem React) do **certificado** do atleta num `<canvas>` A4 paisagem.
 * Design moderno e profissional: moldura dupla, marca, título, corpo em serifa,
 * bloco de dados, **selo** e linhas de assinatura. As cores derivam da **logo**
 * (ou de um accent configurado no ADM). WYSIWYG: o mesmo desenho serve para o
 * preview e para o PDF (o PDF embute o JPEG deste canvas).
 */

import { wrapText } from "./card";

/** Proporção A4 paisagem em px (≈300 DPI): 297mm × 210mm. */
export const CERT_W = 3508;
export const CERT_H = 2480;

const DISPLAY = `'Space Grotesk', system-ui, -apple-system, Arial, sans-serif`;
const SERIF = `Georgia, 'Times New Roman', 'Playfair Display', serif`;

const DEFAULT_ACCENT = "#7c8a1e"; // verde-oliva (legível sobre creme)

export interface CertificatePalette {
  bg: string;
  ink: string;
  soft: string;
  line: string;
  accent: string;
  accentSoft: string;
  accentDeep: string;
}

// ---- utilidades de cor ----
function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}
function parseHex(h: string): { r: number; g: number; b: number } {
  const s = h.replace("#", "");
  const v = s.length === 3 ? s.split("").map((c) => c + c).join("") : s.padEnd(6, "0").slice(0, 6);
  const n = parseInt(v, 16) || 0;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function toHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => clamp(x).toString(16).padStart(2, "0")).join("");
}
function mix(hex: string, target: number, amt: number): string {
  const c = parseHex(hex);
  return toHex(c.r + (target - c.r) * amt, c.g + (target - c.g) * amt, c.b + (target - c.b) * amt);
}
const lighten = (h: string, a: number) => mix(h, 255, a);
const darken = (h: string, a: number) => mix(h, 0, a);

/** Paleta do certificado a partir de um accent (hex). Deriva soft/deep. */
export function certificatePalette(accent?: string): CertificatePalette {
  const clean = accent?.trim();
  const a = clean && /^#?[0-9a-fA-F]{3,6}$/.test(clean) ? (clean[0] === "#" ? clean : `#${clean}`) : DEFAULT_ACCENT;
  return {
    bg: "#faf8f2",
    ink: "#1b1712",
    soft: "#6c6455",
    line: "#d9d2c0",
    accent: a,
    accentSoft: lighten(a, 0.44),
    accentDeep: darken(a, 0.2),
  };
}

export interface CertificateData {
  name: string;
  bib?: string;
  pos: number;
  time?: string;
  timeLabel?: string;
  modality?: string;
  categoryLabel?: string;
  ageGroup?: string;
  ageGroupPos?: string;
  team?: string;
  eventName: string;
  editionYear?: string;
  dateText?: string;
  cityText?: string;
  siteUrl?: string;
  issuedText?: string;
  verifyCode?: string;
  // --- controlado pelo ADM ---
  accent?: string; // cor de destaque (da logo ou config)
  showEventName?: boolean; // nome da corrida ao lado da logo
  message?: string; // observação opcional abaixo do subtítulo
  sig1Label?: string;
  sig1Sub?: string;
  sig2Label?: string;
  sig2Sub?: string;
  showBib?: boolean;
  showTime?: boolean;
  showAgeGroup?: boolean;
  showTeam?: boolean;
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

/** Aplica `letterSpacing` quando suportado (canvas moderno), volta ao normal depois. */
function withTracking(ctx: CanvasRenderingContext2D, px: string, fn: () => void) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  const prev = c.letterSpacing;
  try {
    if ("letterSpacing" in c) c.letterSpacing = px;
    fn();
  } finally {
    if ("letterSpacing" in c) c.letterSpacing = prev ?? "0px";
  }
}

/** Selo circular (anel + serrilha + estrela + colocação). */
function drawSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, pos: number, col: CertificatePalette) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.lineWidth = r * 0.06; ctx.strokeStyle = col.accent; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.lineWidth = r * 0.02; ctx.strokeStyle = col.accentSoft; ctx.stroke();

  const teeth = 40;
  ctx.strokeStyle = col.accent;
  ctx.lineWidth = r * 0.018;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const r1 = r * 1.0, r2 = r * 1.06;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }

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
    ctx.fillStyle = col.accentSoft;
    ctx.fill();
  };
  star(cx, cy - r * 0.42, r * 0.2);

  ctx.fillStyle = col.ink;
  ctx.font = `800 ${Math.round(r * 0.6)}px ${DISPLAY}`;
  ctx.fillText(`${pos}º`, cx, cy + r * 0.06);
  ctx.fillStyle = col.accentDeep;
  ctx.font = `700 ${Math.round(r * 0.155)}px ${DISPLAY}`;
  ctx.fillText("COLOCAÇÃO", cx, cy + r * 0.47);
  ctx.restore();
}

/** Marca no topo: logo (imagem própria/do site) e, opcionalmente, o **nome da
 *  corrida ao lado**. Sem logo, cai para o nome do evento em texto. Centraliza o
 *  conjunto. Retorna o `y` de baixo. */
function drawBrand(ctx: CanvasRenderingContext2D, assets: CertificateAssets, data: CertificateData, cx: number, top: number, h: number, col: CertificatePalette) {
  const name = (data.eventName || "").trim().toUpperCase();
  const hasLogo = !!assets.logo && assets.logo.width > 0;

  if (hasLogo) {
    const logo = assets.logo as HTMLImageElement;
    const ar = logo.width / logo.height;
    const dh = h;
    const dw = ar * dh;

    if (data.showEventName && name) {
      // Lockup horizontal: logo + nome, ajustando o nome para caber ao lado.
      const gap = 52;
      const maxNameW = CERT_W * 0.5 - dw;
      const namePx = fitFont(ctx, name, Math.round(h * 0.5), Math.round(h * 0.26), (px) => `800 ${px}px ${DISPLAY}`, maxNameW);
      ctx.font = `800 ${namePx}px ${DISPLAY}`;
      const nameW = ctx.measureText(name).width;
      const totalW = dw + gap + nameW;
      const startX = cx - totalW / 2;
      ctx.drawImage(logo, startX, top, dw, dh);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = col.ink;
      ctx.fillText(name, startX + dw + gap, top + dh / 2 + namePx * 0.02);
      ctx.textBaseline = "alphabetic";
      return top + dh;
    }
    // Só a logo, centrada.
    const maxW = CERT_W * 0.34;
    const cdw = Math.min(dw, maxW);
    const cdh = (cdw / dw) * dh;
    ctx.drawImage(logo, cx - cdw / 2, top, cdw, cdh);
    return top + cdh;
  }

  // Sem logo → nome do evento como marca (sempre, para não ficar sem cabeçalho).
  ctx.textAlign = "center";
  ctx.fillStyle = col.ink;
  const px = fitFont(ctx, name, Math.round(h * 0.9), Math.round(h * 0.5), (p) => `800 ${p}px ${DISPLAY}`, CERT_W * 0.72);
  ctx.font = `800 ${px}px ${DISPLAY}`;
  ctx.fillText(name, cx, top + h * 0.9);
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
  const col = certificatePalette(data.accent);
  ctx.textBaseline = "alphabetic";

  // ---- Fundo (creme com leve vinheta + tinta suave da marca no rodapé) ----
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `${lighten(col.accent, 0.86)}`);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  // ---- Moldura dupla + cantos ----
  const m = 96;
  ctx.strokeStyle = col.ink;
  ctx.lineWidth = 6;
  ctx.strokeRect(m, m, W - m * 2, H - m * 2);
  const m2 = m + 26;
  ctx.strokeStyle = col.accentSoft;
  ctx.lineWidth = 3;
  ctx.strokeRect(m2, m2, W - m2 * 2, H - m2 * 2);
  const corner = 74;
  ctx.strokeStyle = col.accent;
  ctx.lineWidth = 9;
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

  const innerW = W - m2 * 2 - 200; // largura útil para texto
  let y = m2 + 118;

  // ---- Marca ----
  const brandBottom = drawBrand(ctx, assets, data, cx, y, 156, col);
  y = brandBottom + 96;

  // ---- Título ----
  y += 34;
  ctx.fillStyle = col.ink;
  const titlePx = 214;
  ctx.font = `800 ${titlePx}px ${DISPLAY}`;
  withTracking(ctx, "10px", () => ctx.fillText("CERTIFICADO", cx, y + titlePx * 0.5));
  y += titlePx * 0.62;
  // Subtítulo do tipo + filetes laterais.
  ctx.fillStyle = col.accentDeep;
  ctx.font = `700 54px ${DISPLAY}`;
  const sub = "DE CONCLUSÃO";
  y += 82;
  const subW = ctx.measureText(sub).width + 44;
  withTracking(ctx, "4px", () => ctx.fillText(sub, cx, y));
  ctx.strokeStyle = col.accentSoft;
  ctx.lineWidth = 4;
  const ry = y - 18;
  ctx.beginPath(); ctx.moveTo(cx - subW / 2 - 130, ry); ctx.lineTo(cx - subW / 2 - 44, ry); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + subW / 2 + 44, ry); ctx.lineTo(cx + subW / 2 + 130, ry); ctx.stroke();
  y += 84;

  // Mensagem opcional (ADM)
  const message = data.message?.trim();
  if (message) {
    ctx.fillStyle = col.soft;
    ctx.font = `italic 42px ${SERIF}`;
    for (const line of wrapText(ctx, message, innerW, 2)) {
      ctx.fillText(line, cx, y);
      y += 56;
    }
    y += 18;
  }

  // ---- Corpo ----
  ctx.fillStyle = col.soft;
  ctx.font = `italic 52px ${SERIF}`;
  ctx.fillText("Certificamos que", cx, y);
  y += 136;

  // Nome (serifa, grande, auto-ajustável)
  const name = (data.name || "").trim();
  const namePx = fitFont(ctx, name, 178, 78, (px) => `700 ${px}px ${SERIF}`, innerW);
  ctx.font = `700 ${namePx}px ${SERIF}`;
  ctx.fillStyle = col.ink;
  ctx.fillText(name, cx, y);
  const nameW = Math.min(ctx.measureText(name).width, innerW);
  ctx.strokeStyle = col.accentSoft;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(cx - nameW / 2 - 34, y + 38); ctx.lineTo(cx + nameW / 2 + 34, y + 38); ctx.stroke();
  y += 138;

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

  ctx.fillStyle = col.ink;
  ctx.font = `400 50px ${SERIF}`;
  for (const line of wrapText(ctx, prose, innerW, 3)) {
    ctx.fillText(line, cx, y);
    y += 70;
  }

  // ---- Bloco de dados (respeita os toggles do ADM) ----
  y += 62;
  const stats: { label: string; value: string }[] = [];
  if (data.showBib !== false && data.bib) stats.push({ label: "Número", value: `#${data.bib}` });
  if (data.showTime !== false && data.time) stats.push({ label: data.timeLabel || "Tempo", value: data.time });
  if (data.showAgeGroup !== false && data.ageGroup) stats.push({ label: "Faixa etária", value: data.ageGroup });
  if (data.showTeam !== false && data.team) stats.push({ label: "Equipe", value: data.team });
  if (stats.length) {
    const boxW = 640, boxH = 158, gap = 42;
    const totalW = stats.length * boxW + (stats.length - 1) * gap;
    let bx = cx - totalW / 2;
    for (const s of stats) {
      roundRect(ctx, bx, y, boxW, boxH, 22);
      ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = col.line; ctx.stroke();
      // filete de topo na cor da marca
      roundRect(ctx, bx, y, boxW, 10, 6);
      ctx.fillStyle = col.accentSoft; ctx.fill();
      ctx.textAlign = "center";
      ctx.fillStyle = col.soft;
      ctx.font = `700 28px ${DISPLAY}`;
      ctx.fillText(s.label.toUpperCase(), bx + boxW / 2, y + 62);
      ctx.fillStyle = col.ink;
      const vPx = fitFont(ctx, s.value, 58, 32, (px) => `800 ${px}px ${DISPLAY}`, boxW - 64);
      ctx.font = `800 ${vPx}px ${DISPLAY}`;
      ctx.fillText(s.value, bx + boxW / 2, y + 124);
      bx += boxW + gap;
    }
  }

  // ---- Selo (direita) ----
  const sealR = 214;
  const sealCx = W - m2 - 120 - sealR;
  const sealCy = H - m2 - 120 - sealR;
  drawSeal(ctx, sealCx, sealCy, sealR, data.pos, col);

  // ---- Assinaturas (rótulos do ADM) ----
  const sigY = H - m2 - 224;
  const sigW = 640;
  const drawSig = (centerX: number, label: string, subLine: string) => {
    ctx.strokeStyle = col.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(centerX - sigW / 2, sigY); ctx.lineTo(centerX + sigW / 2, sigY); ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = col.ink; ctx.font = `700 38px ${DISPLAY}`;
    ctx.fillText(label.toUpperCase(), centerX, sigY + 56);
    if (subLine) { ctx.fillStyle = col.soft; ctx.font = `400 32px ${SERIF}`; ctx.fillText(subLine, centerX, sigY + 100); }
  };
  const sigLeft = m2 + 120 + sigW / 2;
  const sigMid = sigLeft + sigW + 170;
  drawSig(sigLeft, data.sig1Label?.trim() || "Organização", data.sig1Sub?.trim() || data.eventName);
  drawSig(sigMid, data.sig2Label?.trim() || "Direção de Prova", data.sig2Sub?.trim() || "Cronometragem oficial");

  // ---- Rodapé (site + emissão + código) ----
  ctx.textAlign = "center";
  ctx.fillStyle = col.soft;
  ctx.font = `400 32px ${DISPLAY}`;
  const footer = [data.siteUrl, data.issuedText, data.verifyCode ? `Autenticação ${data.verifyCode}` : ""]
    .filter(Boolean)
    .join("   ·   ");
  if (footer) ctx.fillText(footer, cx, H - m2 - 46);

  ctx.textAlign = "left";
}

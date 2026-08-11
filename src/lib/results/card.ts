import type { EventInfo, PercursoRoute, RaceResultRow } from "@/lib/content/types";

/**
 * Núcleo (sem React) do **estúdio de cards** da Classificação: formatos, temas de
 * cor, cálculo de pace, campos disponíveis, carregamento de imagem sem tainting e
 * o motor de desenho `drawCard`. Mantém o componente `ShareCardStudio` enxuto e
 * torna as partes puras testáveis.
 */

export type CardFormat = "feed" | "stories";
export type CardTemplate = "foto" | "banner" | "trajeto";
export type CardTheme = "dourado" | "escuro" | "claro" | "terracota";

/** Dimensões por formato (px). Feed 4:5 e Stories 9:16 (padrões do Instagram). */
export const FORMATS: Record<CardFormat, { w: number; h: number; label: string }> = {
  feed: { w: 1080, h: 1350, label: "Feed 4:5" },
  stories: { w: 1080, h: 1920, label: "Stories 9:16" },
};

export interface ThemeSpec {
  bgTop: string;
  bgBottom: string;
  accent: string; // cor de destaque (posição, régua, chips)
  accentInk: string; // texto sobre o acento
  text: string; // texto principal
  sub: string; // texto secundário
}

/** Paletas (HEX do tema do site). */
export const THEMES: Record<CardTheme, ThemeSpec> = {
  dourado: {
    bgTop: "#231814",
    bgBottom: "#120805",
    accent: "#c8ce2e",
    accentInk: "#161200",
    text: "#f4ede6",
    sub: "#c2bdb7",
  },
  escuro: {
    bgTop: "#1d1310",
    bgBottom: "#050403",
    accent: "#c8ce2e",
    accentInk: "#120805",
    text: "#f4ede6",
    sub: "#b2ada7",
  },
  claro: {
    bgTop: "#ffffff",
    bgBottom: "#f1ede6",
    accent: "#8f7b00",
    accentInk: "#ffffff",
    text: "#141210",
    sub: "#6b6a67",
  },
  terracota: {
    bgTop: "#d45b3d",
    bgBottom: "#7a2415",
    accent: "#ffe7a8",
    accentInk: "#3a1109",
    text: "#ffffff",
    sub: "#f6d9cf",
  },
};

export const TEMPLATE_LABEL: Record<CardTemplate, string> = {
  foto: "Foto",
  banner: "Card",
  trajeto: "Trajeto",
};

export const THEME_LABEL: Record<CardTheme, string> = {
  dourado: "Dourado",
  escuro: "Escuro",
  claro: "Claro",
  terracota: "Terracota",
};

/* ------------------------------- Pace ------------------------------------- */

/** Extrai km de textos como "5KM", "10 km", "21,1 KM" ou um número puro. */
export function kmFromText(s?: string): number | undefined {
  if (!s) return undefined;
  const norm = s.replace(",", ".");
  const m = norm.match(/(\d+(?:\.\d+)?)\s*k/i);
  if (m) return parseFloat(m[1]);
  const n = parseFloat(norm);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Converte "HH:MM:SS" ou "MM:SS" em segundos. */
export function secsFromTime(t?: string): number | undefined {
  if (!t) return undefined;
  const p = t.split(":").map((x) => Number(x));
  if (p.some((n) => !Number.isFinite(n))) return undefined;
  let s: number;
  if (p.length === 3) s = p[0] * 3600 + p[1] * 60 + p[2];
  else if (p.length === 2) s = p[0] * 60 + p[1];
  else return undefined;
  return s > 0 ? s : undefined;
}

/** Ritmo médio "m:ss /km" a partir da distância (modalidade) e do tempo. */
export function paceFromModality(
  modality?: string,
  distanceStr?: string,
  timeNet?: string,
): string | undefined {
  const km = kmFromText(modality) ?? kmFromText(distanceStr);
  const secs = secsFromTime(timeNet);
  if (!km || !secs) return undefined;
  const per = secs / km;
  let mm = Math.floor(per / 60);
  let ss = Math.round(per % 60);
  if (ss === 60) {
    mm += 1;
    ss = 0;
  }
  return `${mm}:${String(ss).padStart(2, "0")} /km`;
}

/* ---------------------------- Campos do card ------------------------------ */

export type CardFieldKey =
  | "team"
  | "netTime"
  | "grossTime"
  | "pace"
  | "bib"
  | "age"
  | "ageGroup"
  | "ageGroupPos"
  | "modality"
  | "dateCity";

export interface CardField {
  key: CardFieldKey;
  label: string;
  value: string;
}

/** Distância cadastrada da rota que casa com a modalidade do corredor (p/ pace). */
function routeDistance(routes: PercursoRoute[] | undefined, modality?: string): string | undefined {
  if (!routes?.length) return undefined;
  const km = kmFromText(modality);
  if (km) {
    const hit = routes.find((r) => kmFromText(r.title) === km || kmFromText(r.distance) === km);
    if (hit?.distance) return hit.distance;
  }
  return routes[0]?.distance;
}

/** Campos DISPONÍVEIS (só os com valor) para o usuário escolher exibir no card. */
export function cardFieldOptions(
  row: RaceResultRow,
  event?: EventInfo,
  routes?: PercursoRoute[],
): CardField[] {
  const pace = paceFromModality(row.modality, routeDistance(routes, row.modality), row.timeNet);
  const dateCity = (event?.dateLabel || event?.city || "").trim();
  const list: { key: CardFieldKey; label: string; value?: string }[] = [
    { key: "netTime", label: "Tempo líquido", value: row.timeNet },
    { key: "pace", label: "Pace (min/km)", value: pace },
    { key: "grossTime", label: "Tempo bruto", value: row.timeGross },
    { key: "team", label: "Equipe", value: row.team },
    { key: "modality", label: "Modalidade", value: row.modality },
    { key: "bib", label: "Número", value: row.bib ? `#${row.bib}` : undefined },
    { key: "age", label: "Idade", value: row.age ? `${row.age} anos` : undefined },
    { key: "ageGroup", label: "Faixa etária", value: row.ageGroup },
    { key: "ageGroupPos", label: "Colocação na faixa", value: row.ageGroupPos ? `${row.ageGroupPos}º` : undefined },
    { key: "dateCity", label: "Data / cidade", value: dateCity || undefined },
  ];
  return list.filter((f): f is CardField => !!f.value);
}

/* --------------------------- Imagem taint-safe ---------------------------- */

/** Carrega uma imagem pronta para o canvas sem tainting (Cloudinary devolve
 *  ACAO:*; /api/media é same-origin). Devolve `null` em falha — nunca quebra. */
export function loadImageTaintSafe(url?: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/* ------------------------------- Desenho ---------------------------------- */

export interface LayerTransform {
  /** Deslocamento em px do canvas (aplicado sobre a imagem "cover"). */
  ox: number;
  oy: number;
  /** Zoom multiplicativo sobre a escala "cover" (>= 1). */
  zoom: number;
}

export const DEFAULT_LAYER: LayerTransform = { ox: 0, oy: 0, zoom: 1 };

export interface CardBadge {
  kind: "medal" | "finisher";
  place?: number; // 1..3 na medalha
}

export interface CardModel {
  pos: number;
  name: string;
  categoryLabel: string;
  heroTime?: string;
  chips: { label: string; value: string }[];
  badge: CardBadge | null;
  /** Nome do evento — desenhado como texto quando não há logo (fallback). */
  brandName?: string;
}

export interface CardState {
  template: CardTemplate;
  format: CardFormat;
  theme: CardTheme;
  transparent: boolean;
  photo: LayerTransform;
  map: LayerTransform;
}

export interface CardAssets {
  logo: HTMLImageElement | null;
  photo: HTMLImageElement | null;
  map: HTMLImageElement | null;
  qr: boolean[][] | null;
}

const MEDAL_COLORS: Record<number, string> = { 1: "#c8ce2e", 2: "#c9ccd2", 3: "#cd7f4d" };

/** Desenha a imagem cobrindo o retângulo, com zoom e pan clampados (sem furos). */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  t: LayerTransform,
) {
  const base = Math.max(rw / img.width, rh / img.height);
  const scale = base * Math.max(1, t.zoom);
  const dw = img.width * scale;
  const dh = img.height * scale;
  // Centraliza e aplica o pan, clampando para cobrir o retângulo.
  const maxX = (dw - rw) / 2;
  const maxY = (dh - rh) / 2;
  const ox = Math.max(-maxX, Math.min(maxX, t.ox));
  const oy = Math.max(-maxY, Math.min(maxY, t.oy));
  const dx = rx + (rw - dw) / 2 + ox;
  const dy = ry + (rh - dh) / 2 + oy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

/** Quebra o texto em até `maxLines` (reticências na última se estourar). */
export function wrapText(
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
      if (lines.length === maxLines - 1) {
        cur = words.slice(i).join(" ");
        break;
      }
      cur = w;
    }
  }
  if (lines.length < maxLines) lines.push(cur);
  const li = Math.min(lines.length, maxLines) - 1;
  if (li >= 0 && ctx.measureText(lines[li]).width > maxWidth) {
    let last = lines[li];
    while (last.length > 1 && ctx.measureText(last + "…").width > maxWidth) last = last.slice(0, -1);
    lines[li] = last + "…";
  }
  return lines.slice(0, maxLines);
}

const DISPLAY = `'Space Grotesk', system-ui, -apple-system, Arial, sans-serif`;

/** Garante que as fontes/pesos usados estejam rasterizados antes de desenhar. */
export async function ensureFonts(): Promise<void> {
  try {
    const faces = [
      "700 92px 'Space Grotesk'",
      "600 40px 'Space Grotesk'",
      "500 30px 'Space Grotesk'",
    ];
    await Promise.all(faces.map((f) => document.fonts.load(f)));
    await document.fonts.ready;
  } catch {
    /* segue com fallback */
  }
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

/** Desenha o QR num painel branco (com borda), canto inferior direito. */
function drawQr(ctx: CanvasRenderingContext2D, W: number, H: number, qr: boolean[][], pad: number) {
  const qrSize = 190;
  const n = qr.length;
  const quiet = 4;
  const total = n + quiet * 2;
  const cell = Math.floor(qrSize / total);
  const panel = cell * total;
  const px = W - pad - panel;
  const py = H - 60 - panel;
  roundRect(ctx, px - 10, py - 10, panel + 20, panel + 20, 16);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.stroke();
  ctx.fillStyle = "#000000";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr[r][c]) ctx.fillRect(px + (c + quiet) * cell, py + (r + quiet) * cell, cell, cell);
    }
  }
}

/** Selo (medalha/finisher) no canto superior direito. `sh`/`nosh` aplicam sombra
 *  (usada sobre foto/mapa; nos banners são no-op). */
function drawBadge(
  ctx: CanvasRenderingContext2D,
  W: number,
  model: CardModel,
  pad: number,
  logoTop: number,
  th: ThemeSpec,
  sh: () => void,
  nosh: () => void,
) {
  if (!model.badge) return;
  if (model.badge.kind === "medal") {
    const col = MEDAL_COLORS[model.badge.place ?? 1] ?? MEDAL_COLORS[1];
    const cx = W - pad - 66;
    const cy = logoTop + 66;
    ctx.save();
    sh();
    ctx.beginPath();
    ctx.arc(cx, cy, 66, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    nosh();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.stroke();
    ctx.fillStyle = "#161200";
    ctx.font = `700 46px ${DISPLAY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${model.badge.place}º`, cx, cy + 2);
    ctx.restore();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  } else {
    const label = "FINISHER";
    ctx.font = `700 30px ${DISPLAY}`;
    const bw = ctx.measureText(label).width + 44;
    const bx = W - pad - bw;
    const by = logoTop + 10;
    sh();
    roundRect(ctx, bx, by, bw, 56, 28);
    ctx.fillStyle = th.accent;
    ctx.fill();
    nosh();
    ctx.fillStyle = th.accentInk;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, bx + bw / 2, by + 30);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }
}

/**
 * **Card/Banner de estatísticas** (estilo dos prints do Strava): título grande +
 * grade de rótulo/valor, moderno, em tema claro ou escuro, **sem foto**. A logo
 * do evento aparece no topo (em tema claro, sobre uma pílula escura p/ garantir
 * contraste). QR e selo opcionais.
 */
function drawBanner(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: CardState,
  model: CardModel,
  assets: CardAssets,
) {
  const th = THEMES[state.theme];
  const light = state.theme === "claro";
  ctx.clearRect(0, 0, W, H);
  if (!state.transparent) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, th.bgTop);
    g.addColorStop(1, th.bgBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  const noop = () => {};
  const pad = 84;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Logo (pílula escura atrás no tema claro; fallback ao nome do evento).
  const logoTop = 84;
  if (assets.logo && assets.logo.width > 0) {
    const lh = state.format === "stories" ? 92 : 80;
    const lwFull = (assets.logo.width / assets.logo.height) * lh;
    const cw = Math.min(lwFull, W * 0.5);
    const ch = (cw / assets.logo.width) * assets.logo.height;
    if (light) {
      roundRect(ctx, pad - 16, logoTop - 12, cw + 32, ch + 24, 14);
      ctx.fillStyle = "#141210";
      ctx.fill();
    }
    ctx.drawImage(assets.logo, pad, logoTop, cw, ch);
  } else if (model.brandName) {
    ctx.font = `700 34px ${DISPLAY}`;
    ctx.fillStyle = th.text;
    ctx.fillText(model.brandName.toUpperCase(), pad, logoTop + 6);
  }

  drawBadge(ctx, W, model, pad, logoTop, th, noop, noop);

  // Título: régua + categoria + nome.
  let y = Math.round(H * 0.24);
  ctx.fillStyle = th.accent;
  ctx.fillRect(pad, y, 110, 10);
  y += 34;
  const cat = (model.categoryLabel || "").toUpperCase();
  if (cat) {
    ctx.font = `700 30px ${DISPLAY}`;
    ctx.fillStyle = th.accent;
    ctx.fillText(cat, pad, y);
    y += 48;
  }
  const nameFont = state.format === "stories" ? 76 : 64;
  ctx.font = `700 ${nameFont}px ${DISPLAY}`;
  ctx.fillStyle = th.text;
  for (const line of wrapText(ctx, model.name, W - pad * 2, 3)) {
    ctx.fillText(line, pad, y);
    y += nameFont + 8;
  }
  y += 44;

  // Grade de estatísticas (rótulo em cima, valor grande embaixo).
  const stats: { label: string; value: string }[] = [{ label: "Colocação", value: `${model.pos}º` }];
  if (model.heroTime) stats.push({ label: "Tempo", value: model.heroTime });
  stats.push(...model.chips);
  const cols = 2;
  const gap = 48;
  const cellW = (W - pad * 2 - gap * (cols - 1)) / cols;
  const valPx = state.format === "stories" ? 56 : 50;
  const rowH = valPx + 80;
  let col = 0;
  let gx = pad;
  let gy = y;
  for (const s of stats) {
    ctx.font = `600 24px ${DISPLAY}`;
    ctx.fillStyle = th.sub;
    ctx.fillText(s.label.toUpperCase(), gx, gy);
    ctx.font = `700 ${valPx}px ${DISPLAY}`;
    ctx.fillStyle = th.text;
    ctx.fillText(wrapText(ctx, s.value, cellW, 1)[0], gx, gy + 36);
    col++;
    if (col >= cols) { col = 0; gx = pad; gy += rowH; } else { gx += cellW + gap; }
  }

  if (assets.qr) drawQr(ctx, W, H, assets.qr, pad);
}

/**
 * Desenha o card com **foto/mapa** de fundo + sobreposição (nome/herói/chips).
 * WYSIWYG: o mesmo desenho serve para preview e export.
 */
function drawPhotoCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: CardState,
  model: CardModel,
  assets: CardAssets,
) {
  const th = THEMES[state.theme];
  ctx.clearRect(0, 0, W, H);

  const overImage =
    !state.transparent &&
    ((state.template === "foto" && !!assets.photo) ||
      (state.template === "trajeto" && !!assets.map));
  // Sobre foto/mapa (ou transparente) usamos texto claro + sombra; no "resultado" as cores do tema.
  const textColor = overImage || state.transparent ? "#ffffff" : th.text;
  const subColor = overImage || state.transparent ? "rgba(255,255,255,0.82)" : th.sub;
  const accent = th.accent;

  // ---- Fundo ----
  if (!state.transparent) {
    if (state.template === "foto" && assets.photo) {
      drawCover(ctx, assets.photo, 0, 0, W, H, state.photo);
    } else if (state.template === "trajeto" && assets.map) {
      const g0 = ctx.createLinearGradient(0, 0, 0, H);
      g0.addColorStop(0, th.bgTop);
      g0.addColorStop(1, th.bgBottom);
      ctx.fillStyle = g0;
      ctx.fillRect(0, 0, W, H);
      // Mapa ocupa a parte superior, enquadrável.
      const mapH = Math.round(H * 0.62);
      drawCover(ctx, assets.map, 0, 0, W, mapH, state.map);
    } else {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, th.bgTop);
      g.addColorStop(1, th.bgBottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // Número gigante de fundo (decorativo) no "resultado".
      ctx.save();
      ctx.font = `700 ${Math.round(H * 0.42)}px ${DISPLAY}`;
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.06;
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`${model.pos}`, W + 40, H * 0.72);
      ctx.restore();
    }
    // Scrim inferior para legibilidade sobre foto/mapa.
    if (overImage) {
      const s = ctx.createLinearGradient(0, H * 0.38, 0, H);
      s.addColorStop(0, "rgba(8,6,3,0)");
      s.addColorStop(0.55, "rgba(8,6,3,0.72)");
      s.addColorStop(1, "rgba(8,6,3,0.96)");
      ctx.fillStyle = s;
      ctx.fillRect(0, H * 0.38, W, H * 0.62);
    }
  }

  const pad = 72;
  const shadow = () => {
    if (overImage || state.transparent) {
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 16;
    }
  };
  const noShadow = () => {
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  };

  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // ---- Logo (sempre; fallback ao nome do evento em texto) ----
  const logoTop = 74;
  if (assets.logo && assets.logo.width > 0) {
    const lh = state.format === "stories" ? 96 : 84;
    const lw = (assets.logo.width / assets.logo.height) * lh;
    shadow();
    ctx.drawImage(assets.logo, pad, logoTop, Math.min(lw, W * 0.5), lw > W * 0.5 ? (W * 0.5 / assets.logo.width) * assets.logo.height : lh);
    noShadow();
  } else if (model.brandName) {
    shadow();
    ctx.font = `700 34px ${DISPLAY}`;
    ctx.fillStyle = textColor;
    ctx.fillText(model.brandName.toUpperCase(), pad, logoTop + 6);
    noShadow();
  }

  // ---- Selo (medalha/finisher) top-right ----
  if (model.badge) {
    const cx = W - pad - 66;
    const cy = logoTop + 66;
    if (model.badge.kind === "medal") {
      const col = MEDAL_COLORS[model.badge.place ?? 1] ?? MEDAL_COLORS[1];
      ctx.save();
      shadow();
      ctx.beginPath();
      ctx.arc(cx, cy, 66, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      noShadow();
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.stroke();
      ctx.fillStyle = "#161200";
      ctx.font = `700 46px ${DISPLAY}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${model.badge.place}º`, cx, cy + 2);
      ctx.restore();
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
    } else {
      const label = "FINISHER";
      ctx.font = `700 30px ${DISPLAY}`;
      const tw = ctx.measureText(label).width;
      const bw = tw + 44;
      const bx = W - pad - bw;
      const by = logoTop + 10;
      shadow();
      roundRect(ctx, bx, by, bw, 56, 28);
      ctx.fillStyle = accent;
      ctx.fill();
      noShadow();
      ctx.fillStyle = th.accentInk;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, bx + bw / 2, by + 30);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
    }
  }

  // ---- Bloco de conteúdo (ancorado embaixo) ----
  const hasQr = !!assets.qr;
  const qrSize = 190;
  const bottomReserve = hasQr ? qrSize + 60 : 90;
  let y = H - bottomReserve;

  // Chips (desenhados de baixo p/ cima → medimos a altura antes).
  const chipH = 64;
  const chipGap = 14;
  const chipFont = `600 30px ${DISPLAY}`;
  const chipLabelFont = `500 22px ${DISPLAY}`;

  // Altura estimada do bloco: régua + categoria + nome(2) + herói + chips(1 linha).
  // Desenhamos top-down a partir de um y calculado.
  const nameFontPx = state.format === "stories" ? 68 : 60;
  ctx.font = `700 ${nameFontPx}px ${DISPLAY}`;
  const nameLines = wrapText(ctx, model.name.toUpperCase(), W - pad * 2, 2);
  const heroPx = state.format === "stories" ? 104 : 92;

  const blockH =
    10 + // régua
    46 + // categoria
    nameLines.length * (nameFontPx + 6) +
    24 +
    heroPx +
    (model.chips.length ? chipH + 28 : 0);
  y = H - bottomReserve - blockH;
  if (y < H * 0.32) y = H * 0.32; // não sobe demais

  // Régua
  ctx.fillStyle = accent;
  ctx.fillRect(pad, y, 96, 8);
  y += 30;

  // Categoria + modalidade
  const catLine = [model.categoryLabel].filter(Boolean).join(" ").toUpperCase();
  if (catLine) {
    shadow();
    ctx.font = `700 30px ${DISPLAY}`;
    ctx.fillStyle = accent;
    ctx.fillText(catLine, pad, y);
    noShadow();
    y += 46;
  }

  // Nome
  shadow();
  ctx.fillStyle = textColor;
  ctx.font = `700 ${nameFontPx}px ${DISPLAY}`;
  for (const line of nameLines) {
    ctx.fillText(line, pad, y);
    y += nameFontPx + 6;
  }
  noShadow();
  y += 18;

  // Herói: colocação + tempo
  shadow();
  ctx.font = `700 ${heroPx}px ${DISPLAY}`;
  ctx.fillStyle = accent;
  const posText = `${model.pos}º`;
  ctx.fillText(posText, pad, y);
  const posW = ctx.measureText(posText).width;
  if (model.heroTime) {
    ctx.font = `700 ${Math.round(heroPx * 0.66)}px ${DISPLAY}`;
    ctx.fillStyle = textColor;
    ctx.fillText(model.heroTime, pad + posW + 36, y + heroPx * 0.28);
  }
  noShadow();
  y += heroPx + 28;

  // Chips de stats (uma linha, quebra p/ próxima se faltar largura)
  if (model.chips.length) {
    let cx = pad;
    let cy = y;
    for (const chip of model.chips) {
      ctx.font = chipFont;
      const vW = ctx.measureText(chip.value).width;
      ctx.font = chipLabelFont;
      const lW = ctx.measureText(chip.label.toUpperCase()).width;
      const w = Math.max(vW, lW) + 40;
      if (cx + w > W - pad) {
        cx = pad;
        cy += chipH + chipGap;
      }
      roundRect(ctx, cx, cy, w, chipH, 14);
      ctx.fillStyle = state.transparent || overImage ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.stroke();
      ctx.fillStyle = subColor;
      ctx.font = chipLabelFont;
      ctx.fillText(chip.label.toUpperCase(), cx + 20, cy + 10);
      ctx.fillStyle = textColor;
      ctx.font = chipFont;
      ctx.fillText(chip.value, cx + 20, cy + 30);
      cx += w + chipGap;
    }
  }

  // ---- QR (canto inferior direito) ----
  if (assets.qr) {
    const q = assets.qr;
    const n = q.length;
    const quiet = 4;
    const total = n + quiet * 2;
    const cell = Math.floor(qrSize / total);
    const panel = cell * total;
    const px = W - pad - panel;
    const py = H - 60 - panel;
    roundRect(ctx, px - 10, py - 10, panel + 20, panel + 20, 16);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.fillStyle = "#000000";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (q[r][c]) ctx.fillRect(px + (c + quiet) * cell, py + (r + quiet) * cell, cell, cell);
      }
    }
  }
}

/**
 * Ponto de entrada do desenho — despacha pelo template: **banner** (card de
 * estatísticas, sem foto) ou **foto/trajeto** (imagem de fundo + sobreposição).
 */
export function drawCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: CardState,
  model: CardModel,
  assets: CardAssets,
) {
  if (state.template === "banner") drawBanner(ctx, W, H, state, model, assets);
  else drawPhotoCard(ctx, W, H, state, model, assets);
}

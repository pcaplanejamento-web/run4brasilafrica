import type { EventInfo, PercursoRoute, RaceResultRow } from "@/lib/content/types";

/**
 * Núcleo (sem React) do **estúdio de cards** da Classificação: formatos, temas de
 * cor, cálculo de pace, campos disponíveis, carregamento de imagem sem tainting e
 * o motor de desenho `drawCard`. Mantém o componente `ShareCardStudio` enxuto e
 * torna as partes puras testáveis.
 */

export type CardFormat = "feed" | "stories";
export type CardTemplate = "foto" | "banner" | "destaque" | "mapa";
export type CardTheme = "dourado" | "escuro" | "claro" | "terracota";
/** Modo de fundo dos cards da aba Cards. */
export type CardMode = "escuro" | "claro" | "transparente";

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
  banner: "Estatísticas",
  destaque: "Destaque",
  mapa: "Mapa",
};

/** Modo → tema + transparência para os cards da aba Cards. */
export const MODE_SPEC: Record<CardMode, { theme: CardTheme; transparent: boolean }> = {
  escuro: { theme: "escuro", transparent: false },
  claro: { theme: "claro", transparent: false },
  transparente: { theme: "escuro", transparent: true },
};

export const MODE_LABEL: Record<CardMode, string> = {
  escuro: "Escuro",
  claro: "Claro",
  transparente: "Transparente",
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
  /** Nome do evento — desenhado como texto quando não há logo (fallback) e ao
   *  lado da logo quando `showRaceName` está ligado. */
  brandName?: string;
}

export interface CardState {
  template: CardTemplate;
  format: CardFormat;
  theme: CardTheme;
  transparent: boolean;
  photo: LayerTransform;
  map: LayerTransform;
  /** Desenha o **mapa da prova** como camada SOBRE a foto (card de foto). */
  showMap?: boolean;
  /** Posição/escala da camada do mapa sobre a foto (move + pinça). */
  mapInset?: LayerTransform;
  /** Mostra o nome da corrida ao lado da logo. */
  showRaceName?: boolean;
}

export interface CardAssets {
  logo: HTMLImageElement | null;
  photo: HTMLImageElement | null;
  map: HTMLImageElement | null;
  qr: boolean[][] | null;
}

const MEDAL_COLORS: Record<number, string> = { 1: "#c8ce2e", 2: "#c9ccd2", 3: "#cd7f4d" };

const clampNum = (min: number, max: number, v: number) =>
  Math.max(min, Math.min(max, Number.isFinite(v) ? v : 0));

/** Limites de zoom por camada (fonte única p/ desenho e para os gestos). */
export const PHOTO_ZOOM = { min: 1, max: 4 } as const;
export const MAP_ZOOM = { min: 0.3, max: 2 } as const;

function imgWH(img: HTMLImageElement): { w: number; h: number } {
  return { w: img.naturalWidth || img.width || 1, h: img.naturalHeight || img.height || 1 };
}

/** Escala/pan **cover** clampados p/ a imagem SEMPRE cobrir o retângulo (sem
 *  furos e sem "zona morta": o offset já vem preso aos limites reais). */
export function clampCover(
  t: LayerTransform,
  imgW: number,
  imgH: number,
  rw: number,
  rh: number,
): LayerTransform {
  const zoom = clampNum(PHOTO_ZOOM.min, PHOTO_ZOOM.max, t.zoom || 1);
  const base = Math.max(rw / imgW, rh / imgH);
  const scale = base * zoom;
  const maxX = Math.max(0, (imgW * scale - rw) / 2);
  const maxY = Math.max(0, (imgH * scale - rh) / 2);
  return { zoom, ox: clampNum(-maxX, maxX, t.ox), oy: clampNum(-maxY, maxY, t.oy) };
}

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
  const { w: iw, h: ih } = imgWH(img);
  const c = clampCover(t, iw, ih, rw, rh);
  const base = Math.max(rw / iw, rh / ih);
  const scale = base * c.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rx + (rw - dw) / 2 + c.ox;
  const dy = ry + (rh - dh) / 2 + c.oy;
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

/** Desenha a imagem **inteira** (contain, nunca cortada) centrada num retângulo. */
function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
) {
  const base = Math.min(rw / img.width, rh / img.height);
  const dw = img.width * base;
  const dh = img.height * base;
  ctx.drawImage(img, rx + (rw - dw) / 2, ry + (rh - dh) / 2, dw, dh);
}

/** Retângulo do **mapa sobre a foto** (fonte única p/ desenho e hit-test dos
 *  gestos): mapa **inteiro** (contain), tamanho por zoom, **sempre 100% dentro
 *  do card** (o centro é clampado para nunca sumir). */
export function mapLayerRect(
  W: number,
  H: number,
  mapW: number,
  mapH: number,
  t: LayerTransform,
): { x: number; y: number; w: number; h: number } {
  const zoom = clampNum(MAP_ZOOM.min, MAP_ZOOM.max, t.zoom || 1);
  const aspect = mapH / mapW;
  let w = W * 0.5 * zoom;
  let h = w * aspect;
  const maxW = W * 0.96;
  const maxH = H * 0.9;
  if (w > maxW) { w = maxW; h = w * aspect; }
  if (h > maxH) { h = maxH; w = h / aspect; }
  // Centro preso ao card inteiro → o mapa nunca sai da tela.
  const cx = clampNum(w / 2, W - w / 2, W / 2 + (t.ox || 0));
  const cy = clampNum(h / 2, H - h / 2, H * 0.24 + (t.oy || 0));
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/** Offset/zoom do mapa clampados aos limites reais (sem "zona morta"). */
export function clampMapLayer(t: LayerTransform, mapW: number, mapH: number, W: number, H: number): LayerTransform {
  const zoom = clampNum(MAP_ZOOM.min, MAP_ZOOM.max, t.zoom || 1);
  const aspect = mapH / mapW;
  let w = W * 0.5 * zoom;
  let h = w * aspect;
  const maxW = W * 0.96;
  const maxH = H * 0.9;
  if (w > maxW) { w = maxW; h = w * aspect; }
  if (h > maxH) { h = maxH; w = h / aspect; }
  const ox = clampNum(w / 2 - W / 2, W / 2 - w / 2, t.ox);
  const oy = clampNum(h / 2 - H * 0.24, H - h / 2 - H * 0.24, t.oy);
  return { zoom, ox, oy };
}

/** Mapa da prova como camada **sobre a foto**: fundo **transparente**, o mapa
 *  **inteiro** (nunca cortado) desenhado no tamanho/posição do transform (o
 *  usuário move e usa pinça p/ escala). Sombra suave para legibilidade. */
function drawMapLayer(
  ctx: CanvasRenderingContext2D,
  map: HTMLImageElement,
  W: number,
  H: number,
  t: LayerTransform,
) {
  const { w: mw, h: mh } = imgWH(map);
  const r = mapLayerRect(W, H, mw, mh, t);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 26;
  ctx.drawImage(map, r.x, r.y, r.w, r.h); // mapa inteiro, sem corte
  ctx.restore();
}

/** Logo do evento (fundo transparente) + opcionalmente o **nome da corrida** ao
 *  lado. Fallback ao nome em texto quando não há logo. O caller aplica a sombra
 *  (quando sobre foto). Devolve a altura ocupada. */
function drawLogoName(
  ctx: CanvasRenderingContext2D,
  assets: CardAssets,
  model: CardModel,
  x: number,
  y: number,
  h: number,
  maxLogoW: number,
  textColor: string,
  showRaceName: boolean,
): number {
  if (assets.logo && assets.logo.width > 0) {
    const lwFull = (assets.logo.width / assets.logo.height) * h;
    const cw = Math.min(lwFull, maxLogoW);
    const ch = (cw / assets.logo.width) * assets.logo.height;
    ctx.drawImage(assets.logo, x, y, cw, ch);
    if (showRaceName && model.brandName) {
      ctx.font = `700 ${Math.round(h * 0.42)}px ${DISPLAY}`;
      ctx.fillStyle = textColor;
      ctx.textBaseline = "middle";
      ctx.fillText(model.brandName.toUpperCase(), x + cw + 22, y + ch / 2);
      ctx.textBaseline = "top";
    }
    return ch;
  }
  if (model.brandName) {
    ctx.font = `700 34px ${DISPLAY}`;
    ctx.fillStyle = textColor;
    ctx.fillText(model.brandName.toUpperCase(), x, y + 6);
    return 40;
  }
  return 0;
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

  // Logo (fundo transparente) + opcional nome da corrida ao lado.
  const logoTop = 84;
  const logoH = state.format === "stories" ? 92 : 80;
  drawLogoName(ctx, assets, model, pad, logoTop, logoH, W * 0.42, th.text, !!state.showRaceName);

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
  for (const line of wrapText(ctx, model.name || "", W - pad * 2, 3)) {
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

/** Fundo do card (gradiente do tema) — pulado no modo transparente. */
function drawThemeBg(ctx: CanvasRenderingContext2D, W: number, H: number, th: ThemeSpec, transparent: boolean) {
  ctx.clearRect(0, 0, W, H);
  if (transparent) return;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, th.bgTop);
  g.addColorStop(1, th.bgBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Logo + nome da corrida **centralizados** (lockup). Devolve a altura ocupada. */
function drawLogoNameCentered(
  ctx: CanvasRenderingContext2D,
  assets: CardAssets,
  model: CardModel,
  cx: number,
  y: number,
  h: number,
  textColor: string,
): number {
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  if (assets.logo && assets.logo.width > 0) {
    const w = (assets.logo.width / assets.logo.height) * h;
    ctx.drawImage(assets.logo, cx - w / 2, y, w, h);
    let bottom = y + h;
    if (model.brandName) {
      ctx.font = `700 30px ${DISPLAY}`;
      ctx.fillStyle = textColor;
      ctx.fillText(model.brandName.toUpperCase(), cx, y + h + 16);
      bottom = y + h + 16 + 34;
    }
    return bottom - y;
  }
  if (model.brandName) {
    ctx.font = `700 36px ${DISPLAY}`;
    ctx.fillStyle = textColor;
    ctx.fillText(model.brandName.toUpperCase(), cx, y);
    return 44;
  }
  return 0;
}

/** Visualização **Destaque**: pódio/tempo em grande, centralizado. */
function drawDestaque(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: CardState,
  model: CardModel,
  assets: CardAssets,
) {
  const th = THEMES[state.theme];
  drawThemeBg(ctx, W, H, th, state.transparent);
  const textCol = state.transparent ? "#ffffff" : th.text;
  const noop = () => {};
  const cx = W / 2;
  const pad = 84;

  // Logo (topo, alinhado à esquerda) + nome + selo à direita.
  const logoTop = 84;
  const logoH = state.format === "stories" ? 92 : 80;
  ctx.textAlign = "left";
  drawLogoName(ctx, assets, model, pad, logoTop, logoH, W * 0.42, textCol, !!state.showRaceName);
  drawBadge(ctx, W, model, pad, logoTop, th, noop, noop);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  let y = Math.round(H * (state.format === "stories" ? 0.34 : 0.28));

  const cat = (model.categoryLabel || "").toUpperCase();
  if (cat) {
    ctx.font = `700 32px ${DISPLAY}`;
    ctx.fillStyle = th.accent;
    ctx.fillText(cat, cx, y);
    y += 52;
  }
  const nameFont = state.format === "stories" ? 68 : 58;
  ctx.font = `700 ${nameFont}px ${DISPLAY}`;
  ctx.fillStyle = textCol;
  for (const line of wrapText(ctx, model.name || "", W - pad * 2, 2)) {
    ctx.fillText(line, cx, y);
    y += nameFont + 8;
  }
  y += 30;

  // Colocação gigante.
  const posPx = state.format === "stories" ? 220 : 190;
  ctx.font = `700 ${posPx}px ${DISPLAY}`;
  ctx.fillStyle = th.accent;
  ctx.fillText(`${model.pos}º`, cx, y);
  y += posPx + 6;

  if (model.heroTime) {
    ctx.font = `700 ${state.format === "stories" ? 72 : 60}px ${DISPLAY}`;
    ctx.fillStyle = textCol;
    ctx.fillText(model.heroTime, cx, y);
    y += 90;
  }
  // Chips (pace/equipe…) em uma linha centralizada.
  if (model.chips.length) {
    const parts = model.chips.slice(0, 3).map((c) => `${c.label.toUpperCase()} ${c.value}`);
    ctx.font = `600 28px ${DISPLAY}`;
    ctx.fillStyle = state.transparent ? "rgba(255,255,255,0.8)" : th.sub;
    ctx.fillText(parts.join("   ·   "), cx, y);
  }

  if (assets.qr) drawQr(ctx, W, H, assets.qr, pad);
  ctx.textAlign = "left";
}

/** Visualização **Mapa**: o mapa da prova (inteiro, nunca cortado) + nome do
 *  corredor/tempo e, embaixo, a logo + nome da corrida — tudo centralizado. */
function drawMapaCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: CardState,
  model: CardModel,
  assets: CardAssets,
) {
  const th = THEMES[state.theme];
  drawThemeBg(ctx, W, H, th, state.transparent);
  const textCol = state.transparent ? "#ffffff" : th.text;
  const cx = W / 2;
  const pad = 84;

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Categoria + nome do corredor (topo).
  let y = Math.round(H * 0.10);
  const cat = (model.categoryLabel || "").toUpperCase();
  if (cat) {
    ctx.font = `700 30px ${DISPLAY}`;
    ctx.fillStyle = th.accent;
    ctx.fillText(cat, cx, y);
    y += 46;
  }
  ctx.font = `700 ${state.format === "stories" ? 60 : 52}px ${DISPLAY}`;
  ctx.fillStyle = textCol;
  for (const line of wrapText(ctx, model.name || "", W - pad * 2, 2)) {
    ctx.fillText(line, cx, y);
    y += (state.format === "stories" ? 60 : 52) + 6;
  }
  if (model.heroTime) {
    ctx.font = `700 ${state.format === "stories" ? 56 : 48}px ${DISPLAY}`;
    ctx.fillStyle = th.accent;
    ctx.fillText(model.heroTime, cx, y + 6);
    y += 70;
  }
  y += 20;

  // Mapa INTEIRO (contain, nunca cortado), centralizado, ocupando o miolo.
  const mapAreaTop = y;
  const mapAreaH = Math.round(H * (state.format === "stories" ? 0.42 : 0.38));
  if (assets.map) drawContain(ctx, assets.map, pad, mapAreaTop, W - pad * 2, mapAreaH);
  else {
    ctx.font = `600 26px ${DISPLAY}`;
    ctx.fillStyle = th.sub;
    ctx.fillText("[ mapa do percurso ]", cx, mapAreaTop + mapAreaH / 2 - 16);
  }

  // Rodapé centralizado: logo + nome da corrida.
  const footY = Math.round(H - (state.format === "stories" ? 300 : 220));
  drawLogoNameCentered(ctx, assets, model, cx, footY, state.format === "stories" ? 96 : 84, textCol);

  if (assets.qr) drawQr(ctx, W, H, assets.qr, pad);
  ctx.textAlign = "left";
}

/** Métricas do lockup da **marca** (logo + nome do site) já ajustadas p/ caber. */
interface BrandMetrics {
  name: string;
  hasLogo: boolean;
  lw: number;
  lh: number;
  nameFontPx: number;
  nameW: number;
  gap: number;
  dividerW: number;
  /** Largura total ocupada (0 quando não há nem logo nem nome). */
  total: number;
}

/**
 * Mede o lockup da **marca** (logo do evento + nome do site) no tamanho pedido
 * (`logoH`), reduzindo proporcionalmente se passar de `maxW`. Sem logo → só o
 * nome. A medição é separada do desenho para o card reservar a altura da linha.
 */
function measureBrandLockup(
  ctx: CanvasRenderingContext2D,
  assets: CardAssets,
  model: CardModel,
  logoH: number,
  maxW: number,
): BrandMetrics {
  const name = (model.brandName || "").toUpperCase();
  const hasLogo = !!(assets.logo && assets.logo.width > 0);
  const empty: BrandMetrics = { name, hasLogo, lw: 0, lh: 0, nameFontPx: 0, nameW: 0, gap: 0, dividerW: 0, total: 0 };
  if (!name && !hasLogo) return empty;

  let lh = logoH;
  let lw = 0;
  if (hasLogo) {
    lw = (assets.logo!.width / assets.logo!.height) * lh;
    const maxLogoW = logoH * 3.4;
    if (lw > maxLogoW) { lh *= maxLogoW / lw; lw = maxLogoW; }
  }
  let nameFontPx = Math.round(logoH * 0.5);
  const both = hasLogo && !!name;
  let gap = both ? Math.round(logoH * 0.3) : 0;
  const dividerW = both ? Math.max(2, Math.round(logoH * 0.035)) : 0;
  const measure = () => {
    let nameW = 0;
    if (name) { ctx.font = `800 ${nameFontPx}px ${DISPLAY}`; nameW = ctx.measureText(name).width; }
    return nameW;
  };
  let nameW = measure();
  let total = lw + (both ? gap * 2 + dividerW : 0) + nameW;
  if (maxW > 0 && total > maxW) {
    const k = maxW / total;
    lh = Math.round(lh * k);
    lw = Math.round(lw * k);
    nameFontPx = Math.max(16, Math.round(nameFontPx * k));
    gap = Math.round(gap * k);
    nameW = measure();
    total = lw + (both ? gap * 2 + dividerW : 0) + nameW;
  }
  return { name, hasLogo, lw, lh, nameFontPx, nameW, gap, dividerW, total };
}

/**
 * Desenha o lockup da **marca** medido por `measureBrandLockup`, **alinhado à
 * direita** (terminando em `rightX`) e centrado em `centerY`. Um filete sutil
 * separa a logo do nome (visual mais bonito). O caller aplica a sombra.
 */
function drawBrandLockup(
  ctx: CanvasRenderingContext2D,
  assets: CardAssets,
  m: BrandMetrics,
  rightX: number,
  centerY: number,
  nameColor: string,
) {
  if (!m.total) return;
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let x = rightX - m.total;
  if (m.hasLogo) {
    ctx.drawImage(assets.logo!, x, centerY - m.lh / 2, m.lw, m.lh);
    x += m.lw;
  }
  if (m.hasLogo && m.name) {
    x += m.gap;
    ctx.fillStyle = nameColor === "#ffffff" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.28)";
    ctx.fillRect(x, centerY - m.lh * 0.34, m.dividerW, m.lh * 0.68);
    x += m.dividerW + m.gap;
  }
  if (m.name) {
    ctx.font = `800 ${m.nameFontPx}px ${DISPLAY}`;
    ctx.fillStyle = nameColor;
    ctx.fillText(m.name, x, centerY + 1);
  }
  ctx.restore();
}

/**
 * Desenha o card com **foto** de fundo + sobreposição (nome/herói/chips).
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

  const overImage = !state.transparent && !!assets.photo;
  const textColor = overImage || state.transparent ? "#ffffff" : th.text;
  const subColor = overImage || state.transparent ? "rgba(255,255,255,0.82)" : th.sub;
  const accent = th.accent;

  // ---- Fundo ----
  if (!state.transparent) {
    if (assets.photo) {
      drawCover(ctx, assets.photo, 0, 0, W, H, state.photo);
    } else {
      // Sem foto: gradiente do tema + número gigante decorativo (o card já mostra
      // as informações; o usuário sobe a foto na aba Fotos).
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, th.bgTop);
      g.addColorStop(1, th.bgBottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.font = `700 ${Math.round(H * 0.42)}px ${DISPLAY}`;
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.06;
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`${model.pos}`, W + 40, H * 0.72);
      ctx.restore();
    }
    if (overImage) {
      const s = ctx.createLinearGradient(0, H * 0.38, 0, H);
      s.addColorStop(0, "rgba(8,6,3,0)");
      s.addColorStop(0.55, "rgba(8,6,3,0.72)");
      s.addColorStop(1, "rgba(8,6,3,0.96)");
      ctx.fillStyle = s;
      ctx.fillRect(0, H * 0.38, W, H * 0.62);
    }
  }

  // ---- Mapa da prova SOBRE a foto (movível/pinça, transparente, inteiro). ----
  if (state.showMap && assets.map) {
    drawMapLayer(ctx, assets.map, W, H, state.mapInset ?? DEFAULT_LAYER);
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

  // A **marca** (logo + nome do site) foi para o RODAPÉ, junto dos dados, ao lado
  // da categoria (ver bloco de conteúdo). No topo fica só o selo.
  const logoTop = 74;

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
  const nameLines = wrapText(ctx, (model.name || "").toUpperCase(), W - pad * 2, 2);
  const heroPx = state.format === "stories" ? 104 : 92;

  // Marca (logo + nome do site) MAIOR — mede antes p/ reservar a altura da linha.
  const brand = measureBrandLockup(
    ctx, assets, model,
    state.format === "stories" ? 84 : 74, // logo bem maior que antes
    W * 0.62,
  );
  const catRowH = Math.max(60, brand.lh + 14);

  const blockH =
    30 + // régua + espaço
    catRowH + // linha da categoria + marca
    nameLines.length * (nameFontPx + 6) +
    18 +
    heroPx + 28 +
    (model.chips.length ? chipH : 0);
  y = H - bottomReserve - blockH;
  if (y < H * 0.3) y = H * 0.3; // não sobe demais

  // Régua
  ctx.fillStyle = accent;
  ctx.fillRect(pad, y, 96, 8);
  y += 30;

  // Categoria (esq.) + MARCA maior (logo + nome do site) à direita — "ao lado do 6KM".
  const catLine = [model.categoryLabel].filter(Boolean).join(" ").toUpperCase();
  const rowCenter = y + catRowH / 2;
  shadow();
  drawBrandLockup(ctx, assets, brand, W - pad, rowCenter, textColor);
  noShadow();
  if (catLine) {
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${state.format === "stories" ? 36 : 34}px ${DISPLAY}`;
    ctx.fillStyle = accent;
    const catMaxW = W - pad * 2 - (brand.total ? brand.total + 28 : 0); // não colide com a marca
    shadow();
    ctx.fillText(wrapText(ctx, catLine, catMaxW, 1)[0], pad, rowCenter + 1);
    noShadow();
    ctx.textBaseline = "top";
  }
  y += catRowH;

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
  else if (state.template === "destaque") drawDestaque(ctx, W, H, state, model, assets);
  else if (state.template === "mapa") drawMapaCard(ctx, W, H, state, model, assets);
  else drawPhotoCard(ctx, W, H, state, model, assets);
}

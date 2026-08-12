/**
 * Matemática (pura, sem DOM) do **recorte** de imagem do Armazenamento — usada
 * pelo `MediaCropEditor` e coberta por testes. Trabalha em **pixels naturais** da
 * imagem. Redimensionar com uma **proporção travada** mantém o quadro sempre
 * **dentro da imagem** e com lado mínimo, sem "estourar" nem inverter.
 */

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type CropHandle = "move" | "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export interface AspectPreset {
  label: string;
  /** Proporção largura/altura (px). `null` = livre. */
  value: number | null;
}

/** Formatos de recorte oferecidos (livre + presets pedidos). */
export const CROP_ASPECTS: AspectPreset[] = [
  { label: "Livre", value: null },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "3:4", value: 3 / 4 },
  { label: "9:16", value: 9 / 16 },
  { label: "16:9", value: 16 / 9 },
];

/** Lado mínimo do recorte (px naturais). */
export const CROP_MIN = 16;

const num = (v: number, fb = 0) => (Number.isFinite(v) ? v : fb);
const clampN = (min: number, max: number, v: number) => Math.max(min, Math.min(max, num(v, min)));

/** Prende posição/lados p/ o retângulo caber inteiro na imagem (recorte livre). */
export function clampRect(r: CropRect, natW: number, natH: number): CropRect {
  let { x, y, w, h } = { x: num(r.x), y: num(r.y), w: num(r.w), h: num(r.h) };
  if (w < 0) { x += w; w = -w; }
  if (h < 0) { y += h; h = -h; }
  w = Math.max(CROP_MIN, Math.min(w, natW));
  h = Math.max(CROP_MIN, Math.min(h, natH));
  x = Math.max(0, Math.min(x, natW - w));
  y = Math.max(0, Math.min(y, natH - h));
  return { x, y, w, h };
}

/** Só prende a POSIÇÃO (mover o quadro sem redimensionar). */
export function moveRect(s: CropRect, dx: number, dy: number, natW: number, natH: number): CropRect {
  return {
    x: Math.max(0, Math.min(num(s.x) + dx, natW - s.w)),
    y: Math.max(0, Math.min(num(s.y) + dy, natH - s.h)),
    w: s.w,
    h: s.h,
  };
}

/** Maior retângulo com a proporção `aspect` (l/a), **centralizado** na imagem. */
export function fitAspect(natW: number, natH: number, aspect: number, scale = 0.9): CropRect {
  let w = natW;
  let h = w / aspect;
  if (h > natH) { h = natH; w = h * aspect; }
  w *= scale;
  h *= scale;
  return { x: (natW - w) / 2, y: (natH - h) / 2, w, h };
}

/** Prende só a posição (lados já vêm válidos da trava de proporção). */
function clampPos(r: CropRect, natW: number, natH: number): CropRect {
  return {
    x: Math.max(0, Math.min(r.x, natW - r.w)),
    y: Math.max(0, Math.min(r.y, natH - r.h)),
    w: r.w,
    h: r.h,
  };
}

/**
 * Redimensiona a partir de uma alça. Com `aspect` `null` é **livre** (cada lado
 * independente); com um valor, **trava a proporção** ancorando o lado/canto oposto
 * e limitando ao espaço disponível dentro da imagem (nunca sai nem inverte).
 * `dx`/`dy` são o deslocamento do ponteiro **em px naturais**.
 */
export function resizeRect(
  handle: CropHandle,
  s: CropRect,
  dx: number,
  dy: number,
  aspect: number | null,
  natW: number,
  natH: number,
): CropRect {
  if (handle === "move") return moveRect(s, dx, dy, natW, natH);

  if (aspect == null) {
    let r: CropRect = { ...s };
    switch (handle) {
      case "e": r = { ...s, w: s.w + dx }; break;
      case "w": r = { ...s, x: s.x + dx, w: s.w - dx }; break;
      case "s": r = { ...s, h: s.h + dy }; break;
      case "n": r = { ...s, y: s.y + dy, h: s.h - dy }; break;
      case "se": r = { ...s, w: s.w + dx, h: s.h + dy }; break;
      case "sw": r = { ...s, x: s.x + dx, w: s.w - dx, h: s.h + dy }; break;
      case "ne": r = { ...s, y: s.y + dy, w: s.w + dx, h: s.h - dy }; break;
      case "nw": r = { ...s, x: s.x + dx, y: s.y + dy, w: s.w - dx, h: s.h - dy }; break;
    }
    return clampRect(r, natW, natH);
  }

  // ---- Proporção travada ----
  const wMin = Math.max(CROP_MIN, CROP_MIN * aspect); // garante w≥16 e h=w/aspect≥16
  const hMin = Math.max(CROP_MIN, CROP_MIN / aspect);

  switch (handle) {
    // Cantos: a largura "manda", âncora no canto oposto.
    case "se": {
      const ax = s.x, ay = s.y;
      const wMax = Math.max(wMin, Math.min(natW - ax, (natH - ay) * aspect));
      const w = clampN(wMin, wMax, s.w + dx), h = w / aspect;
      return clampPos({ x: ax, y: ay, w, h }, natW, natH);
    }
    case "sw": {
      const ax = s.x + s.w, ay = s.y;
      const wMax = Math.max(wMin, Math.min(ax, (natH - ay) * aspect));
      const w = clampN(wMin, wMax, s.w - dx), h = w / aspect;
      return clampPos({ x: ax - w, y: ay, w, h }, natW, natH);
    }
    case "ne": {
      const ax = s.x, ay = s.y + s.h;
      const wMax = Math.max(wMin, Math.min(natW - ax, ay * aspect));
      const w = clampN(wMin, wMax, s.w + dx), h = w / aspect;
      return clampPos({ x: ax, y: ay - h, w, h }, natW, natH);
    }
    case "nw": {
      const ax = s.x + s.w, ay = s.y + s.h;
      const wMax = Math.max(wMin, Math.min(ax, ay * aspect));
      const w = clampN(wMin, wMax, s.w - dx), h = w / aspect;
      return clampPos({ x: ax - w, y: ay - h, w, h }, natW, natH);
    }
    // Laterais e/w: largura manda, centro vertical fixo.
    case "e": {
      const ax = s.x, cy = s.y + s.h / 2;
      const availH = 2 * Math.min(cy, natH - cy);
      const wMax = Math.max(wMin, Math.min(natW - ax, availH * aspect));
      const w = clampN(wMin, wMax, s.w + dx), h = w / aspect;
      return clampPos({ x: ax, y: cy - h / 2, w, h }, natW, natH);
    }
    case "w": {
      const ax = s.x + s.w, cy = s.y + s.h / 2;
      const availH = 2 * Math.min(cy, natH - cy);
      const wMax = Math.max(wMin, Math.min(ax, availH * aspect));
      const w = clampN(wMin, wMax, s.w - dx), h = w / aspect;
      return clampPos({ x: ax - w, y: cy - h / 2, w, h }, natW, natH);
    }
    // Topo/base n/s: altura manda, centro horizontal fixo.
    case "s": {
      const ay = s.y, cx = s.x + s.w / 2;
      const availW = 2 * Math.min(cx, natW - cx);
      const hMax = Math.max(hMin, Math.min(natH - ay, availW / aspect));
      const h = clampN(hMin, hMax, s.h + dy), w = h * aspect;
      return clampPos({ x: cx - w / 2, y: ay, w, h }, natW, natH);
    }
    case "n": {
      const ay = s.y + s.h, cx = s.x + s.w / 2;
      const availW = 2 * Math.min(cx, natW - cx);
      const hMax = Math.max(hMin, Math.min(ay, availW / aspect));
      const h = clampN(hMin, hMax, s.h - dy), w = h * aspect;
      return clampPos({ x: cx - w / 2, y: ay - h, w, h }, natW, natH);
    }
  }
  return s;
}

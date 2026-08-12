import { describe, it, expect } from "vitest";
import {
  paceFromModality,
  kmFromText,
  secsFromTime,
  clampCover,
  clampMapLayer,
  mapLayerRect,
  PHOTO_ZOOM,
  MAP_ZOOM,
} from "@/lib/results/card";
import { qrMatrix } from "@/lib/results/qr";

describe("pace", () => {
  it("extrai km de textos variados", () => {
    expect(kmFromText("5KM")).toBe(5);
    expect(kmFromText("10 km")).toBe(10);
    expect(kmFromText("21,1 KM")).toBeCloseTo(21.1);
    expect(kmFromText("")).toBeUndefined();
    expect(kmFromText(undefined)).toBeUndefined();
  });

  it("converte tempo em segundos", () => {
    expect(secsFromTime("00:15:53")).toBe(953);
    expect(secsFromTime("25:00")).toBe(1500);
    expect(secsFromTime("")).toBeUndefined();
  });

  it("calcula pace min/km", () => {
    // 5km em 00:15:53 (953s) → 190.6 s/km → 3:11 /km
    expect(paceFromModality("5KM", undefined, "00:15:53")).toBe("3:11 /km");
    // 10km em 00:50:00 (3000s) → 300 s/km → 5:00 /km
    expect(paceFromModality("10KM", undefined, "00:50:00")).toBe("5:00 /km");
  });

  it("usa a distância da rota quando a modalidade não tem km", () => {
    expect(paceFromModality("Corrida", "5 KM", "00:25:00")).toBe("5:00 /km");
  });

  it("sem distância ou tempo → undefined", () => {
    expect(paceFromModality(undefined, undefined, "00:15:00")).toBeUndefined();
    expect(paceFromModality("5KM", undefined, undefined)).toBeUndefined();
  });
});

describe("clampCover (foto — sempre cobre, sem furos nem zona morta)", () => {
  const W = 1080, H = 1350, iw = 2000, ih = 1000; // paisagem

  it("prende o zoom em [1,4] e nunca deixa < 1 (sem furo)", () => {
    expect(clampCover({ ox: 0, oy: 0, zoom: 0.2 }, iw, ih, W, H).zoom).toBe(PHOTO_ZOOM.min);
    expect(clampCover({ ox: 0, oy: 0, zoom: 99 }, iw, ih, W, H).zoom).toBe(PHOTO_ZOOM.max);
  });

  it("prende offsets exagerados aos limites reais (a imagem ainda cobre)", () => {
    const c = clampCover({ ox: 999999, oy: -999999, zoom: 1 }, iw, ih, W, H);
    const base = Math.max(W / iw, H / ih);
    const maxX = (iw * base - W) / 2;
    expect(c.ox).toBeCloseTo(maxX, 3);
    expect(c.oy).toBeCloseTo(0, 3); // no eixo sem folga, offset zera (não some)
  });

  it("saneia NaN/Infinity (nunca vira desenho quebrado)", () => {
    const c = clampCover({ ox: NaN, oy: Infinity, zoom: NaN }, iw, ih, W, H);
    expect(Number.isFinite(c.ox)).toBe(true);
    expect(Number.isFinite(c.oy)).toBe(true);
    expect(c.zoom).toBe(PHOTO_ZOOM.min);
  });
});

describe("mapLayerRect / clampMapLayer (mapa — inteiro e sempre 100% na tela)", () => {
  const W = 1080, H = 1350, mw = 1600, mh = 900;

  it("o mapa fica sempre inteiramente dentro do card, para qualquer offset", () => {
    for (const t of [
      { ox: 0, oy: 0, zoom: 1 },
      { ox: 99999, oy: 99999, zoom: 2 },
      { ox: -99999, oy: -99999, zoom: 0.3 },
    ]) {
      const r = mapLayerRect(W, H, mw, mh, t);
      expect(r.x).toBeGreaterThanOrEqual(-0.01);
      expect(r.y).toBeGreaterThanOrEqual(-0.01);
      expect(r.x + r.w).toBeLessThanOrEqual(W + 0.01);
      expect(r.y + r.h).toBeLessThanOrEqual(H + 0.01);
      expect(r.w).toBeGreaterThan(0);
      expect(r.h).toBeGreaterThan(0);
    }
  });

  it("clampMapLayer prende o zoom em [0.3,2] e saneia NaN", () => {
    expect(clampMapLayer({ ox: 0, oy: 0, zoom: 9 }, mw, mh, W, H).zoom).toBe(MAP_ZOOM.max);
    expect(clampMapLayer({ ox: 0, oy: 0, zoom: 0.01 }, mw, mh, W, H).zoom).toBe(MAP_ZOOM.min);
    const c = clampMapLayer({ ox: NaN, oy: NaN, zoom: NaN }, mw, mh, W, H);
    expect(Number.isFinite(c.ox) && Number.isFinite(c.oy)).toBe(true);
  });
});

describe("qrMatrix", () => {
  it("gera matriz quadrada com tamanho válido de QR (4v+17)", () => {
    const m = qrMatrix("https://run4brasilafrica.exemplo/#classificacao");
    expect(m.length).toBeGreaterThan(0);
    expect(m.length).toBe(m[0].length); // quadrada
    expect((m.length - 17) % 4).toBe(0); // 4*versão+17
  });

  it("tem os 3 padrões localizadores (finder) nos cantos", () => {
    const m = qrMatrix("teste");
    const n = m.length;
    // Centro do finder (3,3) é escuro; o anel em (3±2) é claro; borda (3±3) escura.
    const finderOK = (cx: number, cy: number) =>
      m[cy][cx] === true && m[cy][cx + 2] === false && m[cy][cx - 2] === false;
    expect(finderOK(3, 3)).toBe(true); // topo-esquerda
    expect(finderOK(n - 4, 3)).toBe(true); // topo-direita
    expect(finderOK(3, n - 4)).toBe(true); // baixo-esquerda
  });
});

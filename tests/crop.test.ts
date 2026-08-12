import { describe, it, expect } from "vitest";
import {
  clampRect,
  fitAspect,
  moveRect,
  resizeRect,
  CROP_ASPECTS,
  CROP_MIN,
  type CropHandle,
} from "@/lib/crop";

const W = 1000, H = 800;
const inside = (r: { x: number; y: number; w: number; h: number }) =>
  r.x >= -0.01 && r.y >= -0.01 && r.x + r.w <= W + 0.01 && r.y + r.h <= H + 0.01 && r.w >= CROP_MIN - 0.01 && r.h >= CROP_MIN - 0.01;

const HANDLES: CropHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

describe("clampRect", () => {
  it("prende dentro da imagem e ao lado mínimo", () => {
    const r = clampRect({ x: -50, y: -50, w: 99999, h: 99999 }, W, H);
    expect(r).toEqual({ x: 0, y: 0, w: W, h: H });
    const tiny = clampRect({ x: 10, y: 10, w: 1, h: 1 }, W, H);
    expect(tiny.w).toBe(CROP_MIN);
    expect(tiny.h).toBe(CROP_MIN);
  });
  it("normaliza lados negativos e saneia NaN", () => {
    const r = clampRect({ x: 100, y: 100, w: -40, h: -60 }, W, H);
    expect(r.w).toBeGreaterThan(0);
    expect(r.h).toBeGreaterThan(0);
    const n = clampRect({ x: NaN, y: NaN, w: NaN, h: NaN }, W, H);
    expect(Number.isFinite(n.x) && Number.isFinite(n.w)).toBe(true);
  });
});

describe("fitAspect", () => {
  it("centraliza e respeita a proporção pedida, dentro da imagem", () => {
    for (const a of CROP_ASPECTS) {
      if (a.value == null) continue;
      const r = fitAspect(W, H, a.value);
      expect(r.w / r.h).toBeCloseTo(a.value, 3);
      expect(inside(r)).toBe(true);
      // centralizado
      expect(r.x + r.w / 2).toBeCloseTo(W / 2, 3);
      expect(r.y + r.h / 2).toBeCloseTo(H / 2, 3);
    }
  });
});

describe("moveRect", () => {
  it("só translada, presa às bordas, sem mudar o tamanho", () => {
    const s = { x: 100, y: 100, w: 200, h: 150 };
    const r = moveRect(s, 99999, -99999, W, H);
    expect(r.w).toBe(200);
    expect(r.h).toBe(150);
    expect(r.x).toBe(W - 200);
    expect(r.y).toBe(0);
  });
});

describe("resizeRect livre", () => {
  it("cada lado é independente", () => {
    const s = { x: 100, y: 100, w: 200, h: 200 };
    const r = resizeRect("se", s, 60, 20, null, W, H);
    expect(r.w).toBeCloseTo(260, 3);
    expect(r.h).toBeCloseTo(220, 3);
  });
});

describe("resizeRect com proporção travada", () => {
  const ratios = CROP_ASPECTS.map((a) => a.value).filter((v): v is number => v != null);

  it("mantém a proporção e fica dentro da imagem — todas as alças, arrastes grandes", () => {
    const s = { x: 300, y: 250, w: 300, h: 250 };
    for (const a of ratios) {
      for (const hd of HANDLES) {
        for (const [dx, dy] of [[80, 40], [-80, -40], [5000, 5000], [-5000, -5000], [3000, -3000]]) {
          const r = resizeRect(hd, s, dx, dy, a, W, H);
          expect(inside(r), `handle ${hd} ratio ${a} d(${dx},${dy})`).toBe(true);
          expect(r.w / r.h, `ratio kept @ ${hd} ${a}`).toBeCloseTo(a, 2);
        }
      }
    }
  });

  it("respeita o lado mínimo ao encolher demais", () => {
    const s = { x: 400, y: 300, w: 200, h: 200 };
    const r = resizeRect("se", s, -99999, -99999, 1, W, H);
    expect(r.w).toBeGreaterThanOrEqual(CROP_MIN - 0.01);
    expect(r.h).toBeGreaterThanOrEqual(CROP_MIN - 0.01);
    expect(r.w / r.h).toBeCloseTo(1, 2);
  });

  it("crescer no canto mantém o canto oposto ancorado", () => {
    const s = { x: 300, y: 300, w: 200, h: 200 };
    const r = resizeRect("se", s, 100, 100, 1, W, H); // âncora = top-left (300,300)
    expect(r.x).toBeCloseTo(300, 3);
    expect(r.y).toBeCloseTo(300, 3);
    expect(r.w / r.h).toBeCloseTo(1, 3);
  });
});

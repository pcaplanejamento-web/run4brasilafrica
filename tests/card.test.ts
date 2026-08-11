import { describe, it, expect } from "vitest";
import { paceFromModality, kmFromText, secsFromTime } from "@/lib/results/card";
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

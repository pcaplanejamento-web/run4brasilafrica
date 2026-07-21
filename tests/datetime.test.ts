import { describe, it, expect } from "vitest";
import { parseBR, fmtDate, fmtShort, countdown } from "@/lib/content/datetime";

describe("parseBR (fuso fixo −03:00)", () => {
  it("interpreta datetime-local como Brasília (−03:00 → UTC)", () => {
    // 07:00 em Brasília = 10:00 UTC
    expect(parseBR("2026-09-14T07:00")).toBe(Date.UTC(2026, 8, 14, 10, 0));
  });

  it("aceita data sem hora (início do dia às 00:00 −03:00)", () => {
    expect(parseBR("2026-09-14")).toBe(Date.UTC(2026, 8, 14, 3, 0));
  });

  it("aceita segundos e espaço no lugar do T (ignora o resto)", () => {
    expect(parseBR("2026-09-14T07:00:30")).toBe(Date.UTC(2026, 8, 14, 10, 0));
    expect(parseBR("2026-09-14 07:00")).toBe(Date.UTC(2026, 8, 14, 10, 0));
  });

  it("é determinístico e independente do fuso do runtime", () => {
    // Duas strings iguais sempre dão o MESMO instante (era o bug: UTC no server,
    // local no cliente). Aqui garantimos o valor absoluto esperado.
    expect(parseBR("2026-01-01T00:00")).toBe(Date.UTC(2026, 0, 1, 3, 0));
  });

  it("retorna null para vazio/indefinido/invalidez", () => {
    expect(parseBR(undefined)).toBeNull();
    expect(parseBR(null)).toBeNull();
    expect(parseBR("")).toBeNull();
    expect(parseBR("não é data")).toBeNull();
  });
});

describe("fmtDate / fmtShort", () => {
  it("formata DD/MM/YYYY e DD/MM sem usar Date (SSR-safe)", () => {
    expect(fmtDate("2026-09-14T07:00")).toBe("14/09/2026");
    expect(fmtShort("2026-09-14T07:00")).toBe("14/09");
  });
  it("string vazia/indefinida → ''", () => {
    expect(fmtDate("")).toBe("");
    expect(fmtDate(undefined)).toBe("");
    expect(fmtShort(null)).toBe("");
  });
});

describe("countdown", () => {
  const base = Date.UTC(2026, 8, 14, 10, 0); // = "2026-09-14T07:00" −03:00

  it("alvo no futuro → partes d/h/m/s", () => {
    const now = base - (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000;
    expect(countdown("2026-09-14T07:00", now)).toEqual({ d: 2, h: 3, m: 4, s: 5 });
  });

  it("alvo já passado ou igual a now → null", () => {
    expect(countdown("2026-09-14T07:00", base)).toBeNull();
    expect(countdown("2026-09-14T07:00", base + 1000)).toBeNull();
  });

  it("alvo inválido/vazio → null", () => {
    expect(countdown(undefined, base)).toBeNull();
    expect(countdown("", base)).toBeNull();
  });
});

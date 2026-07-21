import { describe, it, expect } from "vitest";
import type { Lote } from "@/lib/content/types";
import { parseBR } from "@/lib/content/datetime";
import {
  sortLotes,
  sortLotesDesc,
  loteStatus,
  activeLote,
  validateLotes,
  loteCountdown,
  loteCtaLabel,
} from "@/lib/content/lotes";

const lote = (over: Partial<Lote>): Lote => ({
  id: over.id ?? "l",
  name: over.name ?? "Lote 1",
  text: "",
  ctaLabel: "Inscreva-se",
  url: "https://x",
  date: "",
  colorBg: "#000",
  colorText: "#fff",
  open: false,
  ...over,
});

const at = (s: string) => parseBR(s)!; // época ms de uma data do ADM

describe("loteStatus", () => {
  const l = lote({ openDate: "2026-03-01T00:00", date: "2026-04-01T00:00" });
  it("antes da abertura → upcoming", () => {
    expect(loteStatus(l, at("2026-02-15T00:00"))).toBe("upcoming");
  });
  it("entre abertura e encerramento → open", () => {
    expect(loteStatus(l, at("2026-03-15T00:00"))).toBe("open");
  });
  it("depois do encerramento → closed", () => {
    expect(loteStatus(l, at("2026-04-02T00:00"))).toBe("closed");
  });
  it("sem openDate cai no flag manual `open`", () => {
    expect(loteStatus(lote({ open: true }), 0)).toBe("open");
    expect(loteStatus(lote({ open: false }), 0)).toBe("upcoming");
  });
});

describe("sortLotes / sortLotesDesc", () => {
  it("ordena por número do lote (crescente) e o desc inverte", () => {
    const l1 = lote({ id: "a", name: "Lote 1" });
    const l2 = lote({ id: "b", name: "Lote 2" });
    const l3 = lote({ id: "c", name: "Lote 3" });
    expect(sortLotes([l3, l1, l2]).map((x) => x.id)).toEqual(["a", "b", "c"]);
    expect(sortLotesDesc([l1, l3, l2]).map((x) => x.id)).toEqual(["c", "b", "a"]);
  });
});

describe("activeLote", () => {
  const l1 = lote({ id: "1", name: "Lote 1", openDate: "2026-01-01T00:00", date: "2026-02-01T00:00" });
  const l2 = lote({ id: "2", name: "Lote 2", openDate: "2026-02-01T00:00", date: "2026-03-01T00:00" });

  it("prefere o lote aberto", () => {
    expect(activeLote([l1, l2], at("2026-02-15T00:00"))?.id).toBe("2");
  });
  it("sem aberto, pega o próximo (upcoming)", () => {
    expect(activeLote([l1, l2], at("2025-12-01T00:00"))?.id).toBe("1");
  });
  it("tudo encerrado → último", () => {
    expect(activeLote([l1, l2], at("2027-01-01T00:00"))?.id).toBe("2");
  });
  it("lista vazia → null", () => {
    expect(activeLote([], 0)).toBeNull();
  });
});

describe("validateLotes", () => {
  it("abertura depois do encerramento → erro", () => {
    const errs = validateLotes([lote({ openDate: "2026-04-01T00:00", date: "2026-03-01T00:00" })]);
    expect(errs.length).toBe(1);
  });
  it("lotes sobrepostos → erro", () => {
    const a = lote({ id: "a", name: "Lote 1", openDate: "2026-01-01T00:00", date: "2026-03-01T00:00" });
    const b = lote({ id: "b", name: "Lote 2", openDate: "2026-02-01T00:00", date: "2026-04-01T00:00" });
    expect(validateLotes([a, b]).some((e) => /sobrepor/.test(e))).toBe(true);
  });
  it("dia da corrida antes/igual ao último encerramento → erro", () => {
    const l = lote({ openDate: "2026-01-01T00:00", date: "2026-05-01T00:00" });
    expect(validateLotes([l], "2026-04-01T00:00").some((e) => /dia da corrida/.test(e))).toBe(true);
  });
  it("configuração válida → sem erros", () => {
    const a = lote({ id: "a", name: "Lote 1", openDate: "2026-01-01T00:00", date: "2026-02-01T00:00" });
    const b = lote({ id: "b", name: "Lote 2", openDate: "2026-02-01T00:00", date: "2026-03-01T00:00" });
    expect(validateLotes([a, b], "2026-09-14T07:00")).toEqual([]);
  });
});

describe("loteCountdown", () => {
  const l = lote({ openDate: "2026-03-01T00:00", date: "2026-04-01T00:00" });
  it("upcoming conta para a abertura", () => {
    expect(loteCountdown(l, "upcoming")).toEqual({ date: "2026-03-01T00:00", label: "Inscrições abrem em" });
  });
  it("open conta para o encerramento", () => {
    expect(loteCountdown(l, "open")).toEqual({ date: "2026-04-01T00:00", label: "Inscrições encerram em" });
  });
  it("closed → sem contagem", () => {
    expect(loteCountdown(l, "closed")).toBeNull();
  });
});

describe("loteCtaLabel", () => {
  it("sem lotes → padrão", () => {
    expect(loteCtaLabel([], 0)).toEqual({ label: "Inscreva-se", url: "#inscricao" });
  });
  it("lote aberto → link do lote", () => {
    const l = lote({ openDate: "2026-01-01T00:00", date: "2026-02-01T00:00", url: "https://reg" });
    const r = loteCtaLabel([l], at("2026-01-15T00:00"));
    expect(r.url).toBe("https://reg");
    expect(r.label).toMatch(/Inscreva-se até/);
  });
});

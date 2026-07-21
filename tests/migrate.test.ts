import { describe, it, expect } from "vitest";
import { normalizeContent } from "@/lib/content/migrate";
import { seedContent } from "@/lib/content/seed";
import type { CustomBlock, CustomSection, SiteContent } from "@/lib/content/types";

const clone = (c: SiteContent): SiteContent => structuredClone(c);
const allBlocks = (c: SiteContent): CustomBlock[] =>
  (c.customSections ?? []).flatMap((s) => s.blocks ?? []);
const blockOf = (c: SiteContent, type: string) =>
  allBlocks(c).find((b) => b.type === type);
const aba = (c: SiteContent, id: string) =>
  (c.customSections ?? []).find((s) => s.id === id);

describe("normalizeContent — seções são componentes flat", () => {
  const out = normalizeContent(clone(seedContent));

  it("nenhum bloco `secao` legado sobra (tudo achatado)", () => {
    expect(allBlocks(out).some((b) => (b.type as string) === "secao")).toBe(false);
    expect(allBlocks(out).some((b) => "section" in b)).toBe(false);
  });

  it("A Causa vira a aba custom:a-causa (não há chave `about` no layout)", () => {
    expect(aba(out, "a-causa")).toBeTruthy();
    expect((out.layout ?? []).some((li) => li.key === "about")).toBe(false);
  });

  it("faq/stats viram blocos flat com seus dados", () => {
    expect(blockOf(out, "faq")?.faq).toBeDefined();
    expect(blockOf(out, "stats")?.stats).toBeDefined();
  });

  it("é idempotente (2ª passada = 1ª passada)", () => {
    const twice = normalizeContent(clone(out));
    expect(JSON.stringify(twice)).toBe(JSON.stringify(out));
  });
});

describe("normalizeContent — galeria/inscricao/raceday autocontidos (backfill)", () => {
  const out = normalizeContent(clone(seedContent));

  it("bloco galeria recebe gallery + albums do global", () => {
    const g = blockOf(out, "galeria")!;
    expect(g.albums).toBeDefined();
    expect(g.gallery).toBeDefined();
  });
  it("bloco inscricao recebe inscricao + lotes; raceday recebe raceDate", () => {
    expect(blockOf(out, "inscricao")?.inscricao).toBeDefined();
    expect(blockOf(out, "inscricao")?.lotes).toBeDefined();
    expect(blockOf(out, "raceday")?.raceDate).toBeDefined();
  });
});

describe("normalizeContent — espelho bloco→global + posse do raceDate", () => {
  it("espelha os lotes e a data do bloco de volta ao topo (leitores legados)", () => {
    const base = normalizeContent(clone(seedContent));
    // edita a data no bloco "Dia da Corrida" e re-normaliza
    const edited = clone(base);
    const race = (edited.customSections ?? [])
      .flatMap((s) => s.blocks ?? [])
      .find((b) => b.type === "raceday")!;
    race.raceDate = "2027-10-01T08:00";
    const out = normalizeContent(edited);
    expect(out.inscricao.raceDate).toBe("2027-10-01T08:00");
  });

  it("bloco raceday é dono da data: a cópia vazada do bloco de inscrição NÃO vence", () => {
    const base = normalizeContent(clone(seedContent));
    const edited = clone(base);
    const blocks = (edited.customSections ?? []).flatMap((s) => s.blocks ?? []);
    // cópia vazada (antiga) no bloco de inscrição...
    const insc = blocks.find((b) => b.type === "inscricao")!;
    insc.inscricao = { ...insc.inscricao!, raceDate: "2020-01-01T00:00" };
    // ...e a data REAL no bloco "Dia da Corrida" (dono).
    const race = blocks.find((b) => b.type === "raceday")!;
    race.raceDate = "2027-05-05T09:00";
    const out = normalizeContent(edited);
    // o espelho global usa a data do raceday, não a vazada do bloco de inscrição
    expect(out.inscricao.raceDate).toBe("2027-05-05T09:00");
  });
});

describe("normalizeContent — flatten de blocos `secao` legados", () => {
  it("converte {type:'secao', section:{kind,...}} em bloco flat, sem perder dados", () => {
    const c = clone(seedContent);
    const legacyBlock = {
      id: "leg-b",
      type: "secao",
      section: { kind: "faq", faq: [{ q: "P?", a: "R" }] },
    } as unknown as CustomBlock;
    const legacyAba: CustomSection = { id: "leg", title: "Legado", blocks: [legacyBlock] };
    c.customSections = [...(c.customSections ?? []), legacyAba];
    const out = normalizeContent(c);
    const conv = (out.customSections ?? []).find((s) => s.id === "leg")!.blocks[0];
    expect(conv.type).toBe("faq");
    expect(conv.faq).toEqual([{ q: "P?", a: "R" }]);
    expect("section" in conv).toBe(false);
  });
});

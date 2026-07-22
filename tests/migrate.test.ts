import { describe, it, expect } from "vitest";
import { normalizeContent } from "@/lib/content/migrate";
import { resolveEdition } from "@/lib/content/resolve";
import { seedContent } from "@/lib/content/seed";
import type { CustomBlock, SiteContent, StoredContent } from "@/lib/content/types";

const clone = <T>(c: T): T => structuredClone(c);
/** Conteúdo cru migrado (globais + edições). */
const normed = (raw: Partial<SiteContent>): StoredContent => normalizeContent(clone(raw));
/** View resolvida da edição ativa (mesma forma de SiteContent). */
const view = (raw: Partial<SiteContent>): SiteContent => resolveEdition(normed(raw));

const allBlocks = (c: SiteContent): CustomBlock[] =>
  (c.customSections ?? []).flatMap((s) => s.blocks ?? []);
const blockOf = (c: SiteContent, type: string) => allBlocks(c).find((b) => b.type === type);
const aba = (c: SiteContent, id: string) => (c.customSections ?? []).find((s) => s.id === id);

describe("migração → edições + view resolvida: seções são componentes flat", () => {
  const out = view(seedContent);

  it("nenhum bloco `secao` legado sobra (tudo achatado)", () => {
    expect(allBlocks(out).some((b) => (b.type as string) === "secao")).toBe(false);
    expect(allBlocks(out).some((b) => "section" in b)).toBe(false);
  });

  it("A Causa vira a aba custom:a-causa (não há chave `about` no layout)", () => {
    expect(aba(out, "a-causa")).toBeTruthy();
    expect((out.layout ?? []).some((li) => li.key === "about")).toBe(false);
  });

  it("o Banner/Hero vira a aba sec-hero (primeira do layout)", () => {
    expect(aba(out, "sec-hero")).toBeTruthy();
    expect(blockOf(out, "hero")?.heroCarousels).toBeDefined();
    expect(out.layout[0]?.key).toBe("custom:sec-hero");
  });

  it("faq/stats viram blocos flat com seus dados", () => {
    expect(blockOf(out, "faq")?.faq).toBeDefined();
    expect(blockOf(out, "stats")?.stats).toBeDefined();
  });

  it("é idempotente (2ª passada = 1ª passada)", () => {
    const once = normed(seedContent);
    const twice = normalizeContent(clone(once));
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });
});

describe("view resolvida: galeria/inscricao/raceday autocontidos (backfill)", () => {
  const out = view(seedContent);

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

describe("view resolvida: espelho bloco→global + posse do raceDate", () => {
  it("espelha a data do bloco 'Dia da Corrida' de volta ao topo (leitores legados)", () => {
    const stored = normed(seedContent);
    const race = stored.editions[0].customSections
      .flatMap((s) => s.blocks ?? [])
      .find((b) => b.type === "raceday")!;
    race.raceDate = "2027-10-01T08:00";
    const out = resolveEdition(stored);
    expect(out.inscricao.raceDate).toBe("2027-10-01T08:00");
  });

  it("bloco raceday é dono da data: a cópia vazada do bloco de inscrição NÃO vence", () => {
    const stored = normed(seedContent);
    const blocks = stored.editions[0].customSections.flatMap((s) => s.blocks ?? []);
    const insc = blocks.find((b) => b.type === "inscricao")!;
    insc.inscricao = { ...insc.inscricao!, raceDate: "2020-01-01T00:00" };
    const race = blocks.find((b) => b.type === "raceday")!;
    race.raceDate = "2027-05-05T09:00";
    const out = resolveEdition(stored);
    expect(out.inscricao.raceDate).toBe("2027-05-05T09:00");
  });
});

describe("view resolvida: flatten de blocos `secao` legados", () => {
  it("converte {type:'secao', section:{kind,...}} em bloco flat, sem perder dados", () => {
    const stored = normed(seedContent);
    stored.editions[0].customSections.push({
      id: "leg",
      title: "Legado",
      blocks: [
        {
          id: "leg-b",
          type: "secao",
          section: { kind: "faq", faq: [{ q: "P?", a: "R" }] },
        } as unknown as CustomBlock,
      ],
    });
    const out = resolveEdition(stored);
    const conv = (out.customSections ?? []).find((s) => s.id === "leg")!.blocks[0];
    expect(conv.type).toBe("faq");
    expect(conv.faq).toEqual([{ q: "P?", a: "R" }]);
    expect("section" in conv).toBe(false);
  });
});

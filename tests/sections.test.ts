import { describe, it, expect } from "vitest";
import {
  abaAnchor,
  customKey,
  resolveLayout,
  SECTIONS,
} from "@/lib/content/sections";
import type { CustomSection } from "@/lib/content/types";

describe("resolveLayout", () => {
  it("keeps the registry sections (só hero é built-in) quando nada está salvo", () => {
    const out = resolveLayout(undefined).map((li) => li.key);
    expect(out).toEqual(SECTIONS.map((s) => s.key)); // ["hero"]
  });

  it("reinsere um built-in ausente (hero) na posição, preservando as abas custom", () => {
    // Layout salvo sem `hero`, só com abas custom existentes.
    const stored = [
      { key: customKey("sec-faq"), enabled: true },
      { key: customKey("sec-kit"), enabled: true },
    ];
    const out = resolveLayout(stored, ["sec-faq", "sec-kit"]).map((li) => li.key);
    expect(out).toContain("hero");
    expect(out).toContain(customKey("sec-faq"));
    expect(out).toContain(customKey("sec-kit"));
  });

  it("preserva a ordem manual e o estado ativo/oculto das abas custom", () => {
    const ids = ["a-causa", "sec-faq"];
    const stored = [
      { key: "hero", enabled: true },
      { key: customKey("sec-faq"), enabled: false },
      { key: customKey("a-causa"), enabled: true },
    ];
    const out = resolveLayout(stored, ids);
    const keys = out.map((li) => li.key);
    // ordem manual (faq antes de a-causa) mantida
    expect(keys.indexOf(customKey("sec-faq"))).toBeLessThan(
      keys.indexOf(customKey("a-causa")),
    );
    // flag desativado preservado
    expect(out.find((li) => li.key === customKey("sec-faq"))?.enabled).toBe(false);
  });

  it("descarta chaves built-in que não existem mais (faq/about) e abas órfãs", () => {
    const stored = [
      { key: "hero", enabled: true },
      { key: "faq", enabled: true }, // built-in antigo → removido
      { key: "about", enabled: true }, // built-in antigo → removido
      { key: customKey("sec-orfa"), enabled: true }, // sem customId → removida
    ];
    const out = resolveLayout(stored, ["sec-faq"]).map((li) => li.key);
    expect(out).not.toContain("faq");
    expect(out).not.toContain("about");
    expect(out).not.toContain(customKey("sec-orfa"));
    expect(out).toContain("hero");
  });

  it("anexa ao fim as abas custom que existem mas não estão no layout", () => {
    const out = resolveLayout([{ key: "hero", enabled: true }], ["sec-nova"]).map(
      (li) => li.key,
    );
    expect(out).toContain(customKey("sec-nova"));
  });
});

describe("abaAnchor", () => {
  const aba = (id: string, blocks: CustomSection["blocks"]): CustomSection => ({
    id,
    title: id,
    blocks,
  });

  it("aba de um único bloco de seção usa a âncora da seção", () => {
    expect(abaAnchor(aba("sec-faq", [{ id: "b", type: "faq" }]))).toBe("faq");
    expect(abaAnchor(aba("sec-inscricao", [{ id: "b", type: "inscricao" }]))).toBe(
      "inscricao",
    );
    expect(abaAnchor(aba("sec-raceday", [{ id: "b", type: "raceday" }]))).toBe(
      "dia-da-corrida",
    );
  });

  it("aba com múltiplos blocos usa o wrapper #aba-<id>", () => {
    const a = aba("a-causa", [
      { id: "m", type: "imagem" },
      { id: "t", type: "texto" },
    ]);
    expect(abaAnchor(a)).toBe("aba-a-causa");
  });

  it("aba de um bloco livre (não-seção) também usa #aba-<id>", () => {
    expect(abaAnchor(aba("x", [{ id: "t", type: "texto" }]))).toBe("aba-x");
  });
});

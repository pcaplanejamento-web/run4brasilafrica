import { describe, it, expect } from "vitest";
import { abaAnchor, customKey, resolveLayout, SECTIONS } from "@/lib/content/sections";
import type { CustomSection } from "@/lib/content/types";

describe("resolveLayout", () => {
  it("o registry de seções built-in está vazio (tudo é aba custom, incl. o hero)", () => {
    expect(SECTIONS).toHaveLength(0);
    expect(resolveLayout(undefined)).toEqual([]);
  });

  it("mantém as abas custom (incl. sec-hero) preservando ordem/estado", () => {
    const stored = [
      { key: customKey("sec-hero"), enabled: true },
      { key: customKey("sec-faq"), enabled: false },
      { key: customKey("sec-kit"), enabled: true },
    ];
    const out = resolveLayout(stored, ["sec-hero", "sec-faq", "sec-kit"]);
    const keys = out.map((li) => li.key);
    expect(keys).toEqual([
      customKey("sec-hero"),
      customKey("sec-faq"),
      customKey("sec-kit"),
    ]);
    expect(out.find((li) => li.key === customKey("sec-faq"))?.enabled).toBe(false);
  });

  it("descarta chaves built-in antigas (hero/faq/about) e abas órfãs", () => {
    const stored = [
      { key: "hero", enabled: true }, // built-in antigo → removido (agora é custom:sec-hero)
      { key: "faq", enabled: true }, // built-in antigo → removido
      { key: "about", enabled: true }, // built-in antigo → removido
      { key: customKey("sec-orfa"), enabled: true }, // sem customId → removida
    ];
    const out = resolveLayout(stored, ["sec-faq"]).map((li) => li.key);
    expect(out).not.toContain("hero");
    expect(out).not.toContain("faq");
    expect(out).not.toContain("about");
    expect(out).not.toContain(customKey("sec-orfa"));
  });

  it("anexa ao fim as abas custom que existem mas não estão no layout", () => {
    const out = resolveLayout([], ["sec-hero", "sec-nova"]).map((li) => li.key);
    expect(out).toContain(customKey("sec-hero"));
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
    expect(abaAnchor(aba("sec-hero", [{ id: "b", type: "hero" }]))).toBe("top");
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

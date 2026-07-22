import { describe, it, expect } from "vitest";
import { routePatch } from "@/lib/content/route";
import type { ContactLinks, Edition, SiteContent, StoredContent } from "@/lib/content/types";

const ed = (id: string, year: string, status: Edition["status"]): Edition => ({
  id,
  status,
  event: { brandName: "R4", editionYear: year, dateLabel: "", city: "", tagline: "" },
  branding: {},
  theme: {},
  cloudinary: {},
  analytics: {},
  contact: {} as ContactLinks,
  layout: [{ key: "custom:sec-hero", enabled: true }],
  customSections: [{ id: "sec-hero", title: "Banner", blocks: [{ id: "b", type: "hero" }] }],
});

const base = (): StoredContent => ({
  editions: [ed("ed-2026", "2026", "Ativa"), ed("ed-2025", "2025", "Encerrada")],
  log: [],
});

const patch = (p: Partial<SiteContent>) => p;

describe("routePatch", () => {
  it("config do site (theme/branding/contact) vai para a edição selecionada", () => {
    const out = routePatch(base(), "ed-2025", patch({ theme: { background: "#fff" } }));
    expect(out.editions.find((e) => e.id === "ed-2025")!.theme).toEqual({ background: "#fff" });
    // a outra edição não muda
    expect(out.editions.find((e) => e.id === "ed-2026")!.theme).toEqual({});
    // nada vaza para o topo (StoredContent só tem editions + log)
    expect((out as unknown as Record<string, unknown>).theme).toBeUndefined();
  });

  it("identidade/seções também vão para a edição selecionada", () => {
    const newLayout = [{ key: "custom:sec-faq", enabled: true }];
    const out = routePatch(base(), "ed-2025", patch({ layout: newLayout }));
    expect(out.editions.find((e) => e.id === "ed-2025")!.layout).toEqual(newLayout);
    expect(out.editions.find((e) => e.id === "ed-2026")!.layout).toEqual(base().editions[0].layout);
  });

  it("sem edição selecionada, roteia para a ativa", () => {
    const cs = [{ id: "x", title: "X", blocks: [] }];
    const out = routePatch(base(), null, patch({ customSections: cs }));
    expect(out.editions.find((e) => e.id === "ed-2026")!.customSections).toEqual(cs);
    expect(out.editions.find((e) => e.id === "ed-2025")!.customSections).toEqual(
      base().editions[1].customSections,
    );
  });

  it("a chave `editions` substitui a coleção inteira (gestão de edições)", () => {
    const only = [ed("ed-2030", "2030", "Ativa")];
    const out = routePatch(base(), "ed-2026", patch({ editions: only }));
    expect(out.editions).toEqual(only);
  });

  it("chaves-espelho derivadas (stats/inscricao) são ignoradas — não persistem", () => {
    const out = routePatch(
      base(),
      "ed-2026",
      patch({ stats: [{ value: "9", label: "x" }], inscricao: { title: "y" } } as Partial<SiteContent>),
    );
    expect((out as unknown as Record<string, unknown>).stats).toBeUndefined();
    const active = out.editions.find((e) => e.id === "ed-2026")!;
    expect((active as unknown as Record<string, unknown>).stats).toBeUndefined();
  });

  it("não muta o `base` original", () => {
    const b = base();
    const snapshot = JSON.stringify(b);
    routePatch(b, "ed-2026", patch({ theme: { background: "#000" } }));
    expect(JSON.stringify(b)).toBe(snapshot);
  });
});

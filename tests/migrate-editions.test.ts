import { describe, it, expect } from "vitest";
import { normalizeContent } from "@/lib/content/migrate";
import { resolveEdition } from "@/lib/content/resolve";
import { seedContent } from "@/lib/content/seed";
import type { SiteContent } from "@/lib/content/types";

const clone = <T>(c: T): T => structuredClone(c);

describe("migrateToEditions — single-tenant → multi-tenant", () => {
  it("seed (editions vazio) → uma edição Ativa com o conteúdo do topo", () => {
    const out = normalizeContent(clone(seedContent));
    expect(out.editions).toHaveLength(1);
    expect(out.editions[0].status).toBe("Ativa");
    expect(out.editions[0].event.editionYear).toBe(seedContent.event.editionYear);
    // o conteúdo (abas) foi para dentro da edição, não fica no topo
    expect(out.editions[0].customSections.length).toBeGreaterThan(0);
    expect((out as unknown as Record<string, unknown>).customSections).toBeUndefined();
    expect((out as unknown as Record<string, unknown>).event).toBeUndefined();
  });

  it("edições legadas ({year,date,participants}) → ativa com conteúdo, demais em branco", () => {
    const legacy = clone(seedContent) as unknown as Record<string, unknown>;
    legacy.editions = [
      { year: "2026", date: "14 set 2026", participants: "1.840", status: "Ativa" },
      { year: "2025", date: "8 set 2025", participants: "3.210", status: "Encerrada" },
    ];
    const out = normalizeContent(legacy as unknown as Partial<SiteContent>);
    expect(out.editions).toHaveLength(2);
    const ativa = out.editions.find((e) => e.status === "Ativa")!;
    const encerrada = out.editions.find((e) => e.status === "Encerrada")!;
    expect(ativa.event.editionYear).toBe("2026");
    expect(ativa.customSections.length).toBeGreaterThan(0); // conteúdo migrado
    expect(encerrada.event.editionYear).toBe("2025");
    expect(encerrada.customSections).toHaveLength(0); // em branco
    expect(encerrada.layout).toHaveLength(0);
  });

  it("globais ficam no topo (branding/theme/contact/log), não na edição", () => {
    const out = normalizeContent(clone(seedContent));
    expect(out.branding).toBeDefined();
    expect(out.theme).toBeDefined();
    expect(out.contact).toBeDefined();
    expect(Array.isArray(out.log)).toBe(true);
  });

  it("é idempotente: normalizar de novo o StoredContent não muda nada", () => {
    const once = normalizeContent(clone(seedContent));
    const twice = normalizeContent(clone(once) as unknown as Partial<SiteContent>);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });
});

describe("resolveEdition — view por edição", () => {
  it("edição inexistente cai na ativa; edição em branco resolve sem seções", () => {
    const stored = normalizeContent(clone(seedContent));
    // adiciona uma edição em branco
    stored.editions.push({
      id: "ed-2099",
      status: "Encerrada",
      event: { brandName: "Run4BrasilAfrica", editionYear: "2099", dateLabel: "", city: "", tagline: "" },
      layout: [],
      customSections: [],
    });
    const blank = resolveEdition(stored, "ed-2099");
    expect(blank.event.editionYear).toBe("2099");
    expect(blank.customSections ?? []).toHaveLength(0);
    expect(blank.layout).toHaveLength(0);

    const active = resolveEdition(stored, "nao-existe");
    expect(active.event.editionYear).toBe(seedContent.event.editionYear);
    expect((active.customSections ?? []).length).toBeGreaterThan(0);
  });
});

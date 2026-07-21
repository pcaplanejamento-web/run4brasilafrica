import { describe, it, expect } from "vitest";
import type { Edition, SiteContent } from "@/lib/content/types";
import { activeEdition, editionLabel } from "@/lib/content/editions";
import { normalizeContent } from "@/lib/content/migrate";
import { seedContent } from "@/lib/content/seed";

const ed = (year: string, status: Edition["status"]): Edition => ({
  year,
  date: `set ${year}`,
  participants: "0",
  status,
});

const content = (editions: Edition[], editionYear = "2000"): SiteContent =>
  ({
    editions,
    event: { brandName: "Run4BrasilAfrica", editionYear, dateLabel: "X" },
  }) as SiteContent;

describe("activeEdition", () => {
  it("retorna a de status Ativa", () => {
    expect(activeEdition(content([ed("2025", "Encerrada"), ed("2026", "Ativa")])).year).toBe("2026");
  });
  it("sem Ativa, cai na de maior ano", () => {
    expect(
      activeEdition(content([ed("2024", "Encerrada"), ed("2026", "Encerrada"), ed("2025", "Encerrada")])).year,
    ).toBe("2026");
  });
  it("sem lista, sintetiza a partir de event.editionYear", () => {
    expect(activeEdition(content([], "2030")).year).toBe("2030");
  });
});

describe("editionLabel", () => {
  it("marca = brandName + ano da edição ativa", () => {
    expect(editionLabel(content([ed("2026", "Ativa")]))).toBe("Run4BrasilAfrica 2026");
  });
});

describe("normalizeContent — espelha ano da edição ativa em event.editionYear", () => {
  it("event.editionYear passa a ser o ano da edição Ativa", () => {
    const c = structuredClone(seedContent);
    // torna 2025 a ativa (encerra as demais)
    c.editions = c.editions.map((e) => ({ ...e, status: e.year === "2025" ? "Ativa" : "Encerrada" }));
    const out = normalizeContent(c);
    expect(out.event.editionYear).toBe("2025");
  });

  it("é idempotente quando já está sincronizado", () => {
    const out1 = normalizeContent(structuredClone(seedContent));
    const out2 = normalizeContent(structuredClone(out1));
    expect(out2.event.editionYear).toBe(out1.event.editionYear);
  });
});

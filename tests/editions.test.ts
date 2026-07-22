import { describe, it, expect } from "vitest";
import type { ContactLinks, Edition, StoredContent } from "@/lib/content/types";
import { activeEdition, editionById, editionLabel } from "@/lib/content/editions";

const ed = (year: string, status: Edition["status"]): Edition => ({
  id: `ed-${year}`,
  status,
  event: { brandName: "Run4BrasilAfrica", editionYear: year, dateLabel: "X", city: "", tagline: "" },
  branding: {},
  theme: {},
  cloudinary: {},
  analytics: {},
  contact: {} as ContactLinks,
  layout: [],
  customSections: [],
});

const stored = (editions: Edition[]): StoredContent => ({ editions }) as StoredContent;

describe("activeEdition", () => {
  it("retorna a de status Ativa", () => {
    const e = activeEdition(stored([ed("2025", "Encerrada"), ed("2026", "Ativa")]));
    expect(e?.event.editionYear).toBe("2026");
  });
  it("sem Ativa, cai na de maior ano", () => {
    const e = activeEdition(
      stored([ed("2024", "Encerrada"), ed("2026", "Encerrada"), ed("2025", "Encerrada")]),
    );
    expect(e?.event.editionYear).toBe("2026");
  });
  it("lista vazia → null", () => {
    expect(activeEdition(stored([]))).toBeNull();
  });
});

describe("editionById", () => {
  it("acha por id; fallback para a ativa", () => {
    const c = stored([ed("2025", "Encerrada"), ed("2026", "Ativa")]);
    expect(editionById(c, "ed-2025")?.event.editionYear).toBe("2025");
    expect(editionById(c, "inexistente")?.event.editionYear).toBe("2026");
    expect(editionById(c)?.event.editionYear).toBe("2026");
  });
});

describe("editionLabel", () => {
  it("marca = brandName + ano da edição ativa", () => {
    expect(editionLabel(stored([ed("2026", "Ativa")]))).toBe("Run4BrasilAfrica 2026");
  });
  it("lista vazia → string vazia", () => {
    expect(editionLabel(stored([]))).toBe("");
  });
});

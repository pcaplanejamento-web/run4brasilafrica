import { describe, it, expect } from "vitest";
import type { HeroCarousel, SiteContent } from "@/lib/content/types";
import { parseBR } from "@/lib/content/datetime";
import {
  carouselsOf,
  activeCarousel,
  defaultCarousel,
  nextBoundary,
} from "@/lib/content/carousels";

const at = (s: string) => parseBR(s)!;
const withSlides = { slides: [{ id: "s1" }], slideDurationSeconds: 6, reduceMotion: true };
const noSlides = { slides: [], slideDurationSeconds: 6, reduceMotion: true };

const car = (over: Partial<HeroCarousel>): HeroCarousel =>
  ({ id: "c", name: "C", ...withSlides, ...over }) as HeroCarousel;

describe("carouselsOf", () => {
  it("sem heroCarousels usa content.hero como único padrão", () => {
    const list = carouselsOf({ hero: withSlides } as SiteContent);
    expect(list).toHaveLength(1);
    expect(list[0].isDefault).toBe(true);
  });

  it("garante EXATAMENTE um padrão", () => {
    const list = carouselsOf({
      hero: withSlides,
      heroCarousels: [
        car({ id: "a", isDefault: true }),
        car({ id: "b", isDefault: true }),
        car({ id: "c" }),
      ],
    } as unknown as SiteContent);
    expect(list.filter((c) => c.isDefault)).toHaveLength(1);
    expect(defaultCarousel(list).id).toBe("a");
  });
});

describe("activeCarousel", () => {
  it("só o padrão → padrão", () => {
    const d = car({ id: "def", isDefault: true });
    expect(activeCarousel([d], at("2026-01-01T12:00"))?.id).toBe("def");
  });

  it("agendado dentro da janela e com slides vence o padrão", () => {
    const d = car({ id: "def", isDefault: true });
    const s = car({ id: "promo", startAt: "2026-01-01T00:00", endAt: "2026-02-01T00:00" });
    expect(activeCarousel([d, s], at("2026-01-15T00:00"))?.id).toBe("promo");
  });

  it("fora da janela → padrão", () => {
    const d = car({ id: "def", isDefault: true });
    const s = car({ id: "promo", startAt: "2026-01-01T00:00", endAt: "2026-02-01T00:00" });
    expect(activeCarousel([d, s], at("2026-03-01T00:00"))?.id).toBe("def");
  });

  it("agendado dentro da janela mas SEM slides não apaga o padrão", () => {
    const d = car({ id: "def", isDefault: true });
    const s = car({ id: "vazio", ...noSlides, startAt: "2026-01-01T00:00" }) as HeroCarousel;
    expect(activeCarousel([d, s], at("2026-01-15T00:00"))?.id).toBe("def");
  });

  it("lista vazia → null", () => {
    expect(activeCarousel([], 0)).toBeNull();
  });
});

describe("nextBoundary", () => {
  it("retorna o próximo início/fim estritamente após now", () => {
    const s = car({ id: "p", startAt: "2026-01-10T00:00", endAt: "2026-01-20T00:00" });
    expect(nextBoundary([s], at("2026-01-01T00:00"))).toBe(at("2026-01-10T00:00"));
    expect(nextBoundary([s], at("2026-01-15T00:00"))).toBe(at("2026-01-20T00:00"));
    expect(nextBoundary([s], at("2026-02-01T00:00"))).toBeNull();
  });
});

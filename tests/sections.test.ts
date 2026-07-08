import { describe, it, expect } from "vitest";
import { resolveLayout, SECTIONS } from "@/lib/content/sections";

describe("resolveLayout", () => {
  it("keeps every registry section even when nothing is stored", () => {
    const out = resolveLayout(undefined).map((li) => li.key);
    expect(out.sort()).toEqual(SECTIONS.map((s) => s.key).sort());
  });

  it("inserts a new section at its registry position (after its sibling), not at the end", () => {
    // Stored layout as if "sejaParceiro" (added later) never existed.
    const stored = SECTIONS.filter((s) => s.key !== "sejaParceiro").map((s) => ({
      key: s.key,
      enabled: true,
    }));
    const out = resolveLayout(stored).map((li) => li.key);
    const i = out.indexOf("parceiros");
    expect(out[i + 1]).toBe("sejaParceiro");
    expect(out[out.length - 1]).not.toBe("sejaParceiro");
  });

  it("preserves manual order and disabled state of known sections", () => {
    const stored = [
      { key: "hero", enabled: true },
      { key: "faq", enabled: false },
      { key: "about", enabled: true },
    ];
    const out = resolveLayout(stored);
    const keys = out.map((li) => li.key);
    // manual order (faq before about) is kept
    expect(keys.indexOf("faq")).toBeLessThan(keys.indexOf("about"));
    // disabled flag preserved
    expect(out.find((li) => li.key === "faq")?.enabled).toBe(false);
  });

  it("drops unknown keys from stored layout", () => {
    const stored = [{ key: "ghost-section", enabled: true }];
    const out = resolveLayout(stored).map((li) => li.key);
    expect(out).not.toContain("ghost-section");
  });
});

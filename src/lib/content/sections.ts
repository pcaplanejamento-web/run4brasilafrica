import type { CustomSection, LayoutItem, SectionKind } from "./types";
import { isSectionKind, SECTION_ANCHOR } from "./sectionKinds";

/**
 * Registry of the homepage sections that the ADM can reorder / enable-disable
 * from the dashboard. `key` is stored in `content.layout`; `href` is the ADM
 * page that configures that section. Order here is the default order.
 */
export interface SectionMeta {
  key: string;
  label: string;
  href: string;
}

export const SECTIONS: SectionMeta[] = [
  // TODAS as seções são abas (custom sections) agora — inclusive o Banner/Hero,
  // que virou a aba `sec-hero` (SectionKind "hero"). Ver migrate.ts
  // SECTION_MIGRATIONS. Este registry ficou vazio: não há mais seção built-in no
  // layout; `resolveLayout` só preserva/anexa as abas `custom:<id>`.
];

export function sectionMeta(key: string): SectionMeta | undefined {
  return SECTIONS.find((s) => s.key === key);
}

/** Custom "aba" layout key helpers. */
export const CUSTOM_PREFIX = "custom:";
export function customKey(id: string): string {
  return `${CUSTOM_PREFIX}${id}`;
}
export function isCustomKey(key: string): boolean {
  return key.startsWith(CUSTOM_PREFIX);
}
export function customIdFromKey(key: string): string | null {
  return isCustomKey(key) ? key.slice(CUSTOM_PREFIX.length) : null;
}

/**
 * Âncora (id no DOM) de uma aba na tela inicial, para rolar até ela. Uma aba de
 * um único bloco de seção usa a âncora da seção (`#faq`, `#inscricao`, …); as
 * demais usam o wrapper `#aba-<id>`. Casa com o render em `CustomSectionView`.
 */
export function abaAnchor(section: CustomSection): string {
  const blocks = section.blocks ?? [];
  if (blocks.length === 1 && isSectionKind(blocks[0].type)) {
    return SECTION_ANCHOR[blocks[0].type as SectionKind];
  }
  return `aba-${section.id}`;
}

/**
 * Merge a stored layout with the registry: keep the stored order (valid keys
 * only) and preserve any manual reordering, then insert built-in sections not
 * present yet **at their natural registry position** (right after the nearest
 * preceding registry-sibling that exists). Custom "aba" keys (`custom:<id>`) are
 * kept when they still exist (`customIds`) and appended if not yet placed.
 */
export function resolveLayout(
  stored: LayoutItem[] | undefined,
  customIds?: string[],
): LayoutItem[] {
  const known = new Set(SECTIONS.map((s) => s.key));
  const customSet = customIds ? new Set(customIds.map(customKey)) : null;
  const isValid = (key: string) =>
    known.has(key) || (isCustomKey(key) && (customSet ? customSet.has(key) : true));

  const result = (stored ?? []).filter((li) => isValid(li.key));
  const present = new Set(result.map((li) => li.key));

  SECTIONS.forEach((s, idx) => {
    if (present.has(s.key)) return;
    // Insert just after the previous registry section already in the layout.
    let insertAt = result.length;
    for (let i = idx - 1; i >= 0; i--) {
      const pos = result.findIndex((li) => li.key === SECTIONS[i].key);
      if (pos >= 0) {
        insertAt = pos + 1;
        break;
      }
    }
    result.splice(insertAt, 0, { key: s.key, enabled: true });
    present.add(s.key);
  });

  // Append any custom sections that exist but aren't in the layout yet.
  if (customSet) {
    customSet.forEach((k) => {
      if (!present.has(k)) {
        result.push({ key: k, enabled: true });
        present.add(k);
      }
    });
  }

  return result;
}

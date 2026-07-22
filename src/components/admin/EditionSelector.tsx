"use client";

import { useContent } from "@/lib/content/store";
import { editionLabelFor } from "@/lib/content/editions";

/**
 * Seletor de **edição** no topo da sidebar do ADM (item 7). Trocar a edição
 * re-resolve a view do store → as abas de SEÇÃO (topo) passam a refletir a edição
 * escolhida; as abas administrativas (baixo) não mudam (item 8). A edição ativa é
 * marcada. Só ADM logado vê isto (a sidebar é interna).
 */
export default function EditionSelector() {
  const { content, selectedEditionId, selectEdition, hydrated } = useContent();
  const editions = content.editions ?? [];
  if (!hydrated || editions.length === 0) return null;

  return (
    <div className="mb-3 px-6">
      <label
        htmlFor="adm-edition-select"
        className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#999]"
      >
        Edição em edição
      </label>
      <select
        id="adm-edition-select"
        value={selectedEditionId ?? ""}
        onChange={(e) => selectEdition(e.target.value)}
        className="w-full rounded-md border border-[#555] bg-[#2f2f2f] px-2.5 py-2 text-[13px] text-white outline-none focus:border-terracotta"
      >
        {editions.map((ed) => (
          <option key={ed.id} value={ed.id}>
            {editionLabelFor(ed)}
            {ed.status === "Ativa" ? " · Ativa" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

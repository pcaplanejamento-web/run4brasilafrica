"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADM_NAV, type AdmNavItem } from "./nav";
import { useAuth } from "./AuthProvider";
import EditionSelector from "./EditionSelector";
import { useContent } from "@/lib/content/store";
import {
  customIdFromKey,
  isCustomKey,
  resolveLayout,
  sectionMeta,
} from "@/lib/content/sections";

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: AdmNavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className="border-l-[3px] px-6 py-3 text-[14px] transition-colors"
      style={{
        background: active ? "var(--color-adm-sidebar-active)" : "transparent",
        borderLeftColor: active ? "var(--color-terracotta)" : "transparent",
        color: active ? "#fff" : "#bbb",
      }}
    >
      {item.label}
    </Link>
  );
}

/**
 * ADM navigation rail. The section tabs follow the SAME order the home
 * components have in the dashboard (`content.layout`); tabs that aren't home
 * sections (textos, avisos, edições, log, backup, configurações, usuários) are
 * pinned to the bottom, just above the administrator block.
 */
export default function AdmSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { content } = useContent();

  const byHref = (href: string) => ADM_NAV.find((n) => n.href === href);

  // Section tabs in the dashboard's component order (deduped by ADM page, since
  // a few sections share one page — e.g. Hero + A Causa → Banner). Custom "abas"
  // are interleaved at their layout position, each linking to its own config page.
  const customSections = content.customSections ?? [];
  const sectionItems: AdmNavItem[] = [];
  const seenHref = new Set<string>();
  for (const li of resolveLayout(
    content.layout,
    customSections.map((s) => s.id),
  )) {
    if (isCustomKey(li.key)) {
      const id = customIdFromKey(li.key);
      const cs = customSections.find((s) => s.id === id);
      if (!cs) continue;
      const href = `/admin/custom/${id}`;
      if (seenHref.has(href)) continue;
      seenHref.add(href);
      sectionItems.push({ key: li.key, label: cs.title?.trim() || "Aba sem título", href });
    } else {
      const meta = sectionMeta(li.key);
      if (!meta || seenHref.has(meta.href)) continue;
      const navItem = byHref(meta.href);
      if (!navItem) continue;
      seenHref.add(meta.href);
      sectionItems.push(navItem);
    }
  }
  const sectionHrefSet = seenHref;

  // Grupo administrativo (baixo) — NÃO muda ao trocar de edição (item 8). O
  // Dashboard entra aqui (item 1: dentro do grupo de configurações), como
  // primeira aba; "Usuários" fica por último, logo acima do bloco da conta.
  const bottom = ADM_NAV.filter((n) => !sectionHrefSet.has(n.href));
  const bottomOrdered = [
    ...bottom.filter((n) => n.key === "dashboard"),
    ...bottom.filter((n) => n.key !== "dashboard" && n.key !== "usuarios"),
    ...bottom.filter((n) => n.key === "usuarios"),
  ];

  return (
    <div className="flex min-h-full w-[240px] flex-col bg-adm-sidebar py-7 text-[#ddd]">
      <Link
        href="/admin/dashboard"
        onClick={onNavigate}
        className="mb-4 block border-b border-[#444] px-6 pb-6 text-[15px] font-bold text-white"
      >
        R4BA · Admin
      </Link>

      {/* Seletor de edição (item 7) — no topo; troca a edição sendo editada. */}
      <EditionSelector />

      <nav className="flex flex-col">
        {sectionItems.map((n) => (
          <NavLink key={n.key} item={n} active={pathname === n.href} onNavigate={onNavigate} />
        ))}
      </nav>

      <nav className="mt-auto flex flex-col border-t border-[#444] pt-2">
        {bottomOrdered.map((n) => (
          <NavLink key={n.key} item={n} active={pathname === n.href} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-4 border-t border-[#444] px-6 pt-5">
        {user && (
          <div className="mb-3">
            <div className="text-[13px] font-semibold text-white">{user.name}</div>
            <div className="text-[11px] text-[#999]">{user.role}</div>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            logout();
          }}
          className="text-[13px] text-[#999] transition-colors hover:text-white"
        >
          Sair
        </button>
      </div>
    </div>
  );
}

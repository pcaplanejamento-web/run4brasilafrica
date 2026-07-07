"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADM_NAV, type AdmNavItem } from "./nav";
import { useAuth } from "./AuthProvider";
import { useContent } from "@/lib/content/store";
import { resolveLayout, sectionMeta } from "@/lib/content/sections";

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
  const dashboard = byHref("/admin/dashboard");

  // Section tabs in the dashboard's component order (deduped by ADM page, since
  // a few sections share one page — e.g. Hero + A Causa → Banner).
  const sectionHrefs: string[] = [];
  for (const li of resolveLayout(content.layout)) {
    const meta = sectionMeta(li.key);
    if (meta && !sectionHrefs.includes(meta.href)) sectionHrefs.push(meta.href);
  }
  const sectionItems = sectionHrefs
    .map(byHref)
    .filter((n): n is AdmNavItem => !!n);
  const sectionHrefSet = new Set(sectionItems.map((n) => n.href));

  // Everything else (not a home section, not the dashboard) sits at the bottom;
  // "Usuários" (administrator) goes last, just above the account block.
  const bottom = ADM_NAV.filter(
    (n) => n.key !== "dashboard" && !sectionHrefSet.has(n.href),
  );
  const bottomOrdered = [
    ...bottom.filter((n) => n.key !== "usuarios"),
    ...bottom.filter((n) => n.key === "usuarios"),
  ];

  return (
    <div className="flex h-full min-h-full w-[240px] flex-col bg-adm-sidebar py-7 text-[#ddd]">
      <Link
        href="/admin/dashboard"
        onClick={onNavigate}
        className="mb-4 block border-b border-[#444] px-6 pb-6 text-[15px] font-bold text-white"
      >
        R4BA · Admin
      </Link>

      <nav className="flex flex-col">
        {dashboard && (
          <NavLink
            item={dashboard}
            active={pathname === dashboard.href}
            onNavigate={onNavigate}
          />
        )}
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

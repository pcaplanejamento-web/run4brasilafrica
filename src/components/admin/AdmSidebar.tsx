"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADM_NAV } from "./nav";
import { useAuth } from "./AuthProvider";

/** ADM navigation rail (ported from AdmSidebar.dc.html). */
export default function AdmSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
        {ADM_NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.key}
              href={n.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className="flex items-center gap-2.5 border-l-[3px] px-6 py-3 text-[14px] transition-colors"
              style={{
                background: active ? "var(--color-adm-sidebar-active)" : "transparent",
                borderLeftColor: active ? "var(--color-terracotta)" : "transparent",
                color: active ? "#fff" : "#bbb",
              }}
            >
              <span className="h-4 w-4 flex-none rounded-[3px] border border-[#888]" />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[#444] px-6 pt-5">
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

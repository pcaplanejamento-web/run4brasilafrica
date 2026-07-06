"use client";

import { useState } from "react";
import AdmSidebar from "./AdmSidebar";

/**
 * Responsive ADM chrome: fixed sidebar on desktop, slide-in drawer on mobile
 * (touch target header button, backdrop to dismiss).
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="flex min-h-screen bg-adm-bg font-sans text-adm-ink">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-none overflow-y-auto md:block">
        <AdmSidebar />
      </aside>

      {/* Mobile drawer + backdrop */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${drawer ? "" : "pointer-events-none"}`}
        aria-hidden={!drawer}
      >
        <div
          onClick={() => setDrawer(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            drawer ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute left-0 top-0 h-full overflow-y-auto shadow-2xl transition-transform duration-300 ${
            drawer ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AdmSidebar onNavigate={() => setDrawer(false)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-adm-border bg-adm-sidebar px-4 py-3 text-white md:hidden">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Abrir menu"
            className="flex h-10 w-10 flex-col items-center justify-center gap-[5px]"
          >
            <span className="block h-[2px] w-6 bg-white" />
            <span className="block h-[2px] w-6 bg-white" />
            <span className="block h-[2px] w-6 bg-white" />
          </button>
          <span className="text-[15px] font-bold">R4BA · Admin</span>
        </header>

        <main className="min-w-0 flex-1 p-5 sm:p-7 md:px-11 md:py-9">{children}</main>
      </div>
    </div>
  );
}

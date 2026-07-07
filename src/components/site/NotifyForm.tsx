"use client";

import { useState } from "react";

/**
 * "Avise-me quando abrir o lote" — collects an e-mail (stored in the site's own
 * database via /api/subscribe). Compact, works on the colored lote band.
 */
export default function NotifyForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = (await r.json()) as { ok: boolean };
      setState(d.ok ? "ok" : "error");
      if (d.ok) setEmail("");
    } catch {
      setState("error");
    }
  }

  if (state === "ok") {
    return (
      <p className="mt-4 text-[14px] font-semibold">
        Pronto! Avisaremos você por e-mail assim que abrir.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <div className="mb-1.5 text-[13px] font-semibold">
        Quer ser avisado quando abrir? Deixe seu e-mail:
      </div>
      <div className="flex max-w-[420px] flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="min-h-11 flex-1 rounded border border-black/20 bg-white/90 px-3 text-[14px] text-ink outline-none focus:border-black/50"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="min-h-11 whitespace-nowrap rounded bg-black/85 px-5 text-[14px] font-bold uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state === "loading" ? "Enviando…" : "Avise-me"}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-1.5 text-[12px] font-semibold">
          Não foi possível registrar agora. Tente novamente.
        </p>
      )}
    </form>
  );
}

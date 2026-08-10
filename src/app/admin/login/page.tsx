"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * ADM login. Autentica em `/api/auth/login` (D1 `users` + sessão via cookie
 * httpOnly). Distingue os modos de falha: credencial inválida (JSON de erro),
 * erro do servidor (resposta sem JSON, ex.: 500 durante um redeploy) e falha de
 * rede (o `fetch` lança) — cada um com mensagem própria e amigável a retry.
 */
export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      // Parse defensivo: um 500 durante um redeploy pode vir como HTML (sem JSON).
      const data = (await res
        .json()
        .catch(() => null)) as { ok: boolean; code?: string; error?: string; detail?: string } | null;

      // ok = authenticated; not_configured = local dev (open) → let in.
      if (data && (data.ok || data.code === "not_configured")) {
        router.push("/admin/dashboard");
        return;
      }
      if (data?.error) {
        // `detail` é temporário (diagnóstico em produção) — some quando resolvido.
        setError(data.detail ? `${data.error} [${data.detail}]` : data.error);
      } else {
        // Resposta sem JSON (servidor reiniciando/instável) → orienta a repetir.
        setError("Servidor indisponível no momento. Aguarde alguns segundos e tente novamente.");
      }
    } catch {
      // O `fetch` só lança em falha de rede real (offline, DNS, requisição abortada).
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-deep px-5 font-sans">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[420px] rounded-[10px] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,.35)] sm:p-11"
      >
        <div className="text-center font-display text-[20px] font-bold uppercase text-[oklch(0.2_0.02_40)]">
          RUN4BRASIL<span className="text-[oklch(0.62_0.16_35)]">AFRICA</span>
        </div>
        <div className="mb-8 mt-1.5 text-center text-[13px] uppercase tracking-[0.04em] text-[#888]">
          Painel administrativo
        </div>

        <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-semibold text-[#444]">
          E-mail
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@run4brasilafrica.com"
          className="mb-4 w-full rounded-md border border-[#ccc] px-3.5 py-2.5 text-[14px] text-adm-ink outline-none focus:border-terracotta"
        />

        <label htmlFor="login-password" className="mb-1.5 block text-[13px] font-semibold text-[#444]">
          Senha
        </label>
        <input
          id="login-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mb-2.5 w-full rounded-md border border-[#ccc] px-3.5 py-2.5 text-[14px] text-adm-ink outline-none focus:border-terracotta"
        />

        <div className="mb-6 text-right">
          <button
            type="button"
            className="text-[12px] text-[oklch(0.55_0.14_35)] hover:underline"
          >
            Esqueci minha senha
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-[#e0b4b0] bg-[#fdf2f1] px-3.5 py-2.5 text-[13px] text-[#c0392b]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="block w-full rounded-md bg-[oklch(0.55_0.16_35)] py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="mt-6 text-center text-[12px] text-[#aaa]">
          Acesso restrito à equipe organizadora
        </div>
      </form>
    </div>
  );
}

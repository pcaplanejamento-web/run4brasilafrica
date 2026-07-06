"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/admin/AuthProvider";
import {
  AdmLoading,
  Card,
  FieldLabel,
  GhostButton,
  PageHeader,
  PrimaryButton,
  Select,
  TextInput,
} from "@/components/admin/ui";

const ROLES = ["Administrador geral", "Editor de conteúdo"];

interface Row {
  id: number;
  email: string;
  name: string;
  role: string;
  last_access: string | null;
}

export default function UsuariosPage() {
  const { user, configured } = useAuth();
  const isAdmin = !configured || user?.role === "Administrador geral";

  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: ROLES[1] });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; users?: Row[]; error?: string; code?: string };
      if (data.code === "not_configured") {
        setRows([]);
        setError("Gestão de usuários funciona apenas no site publicado (com backend).");
        return;
      }
      if (!data.ok) {
        setError(data.error ?? "Não foi possível carregar os usuários.");
        setRows([]);
        return;
      }
      setRows(data.users ?? []);
      setError(null);
    } catch {
      setError("Falha de conexão.");
      setRows([]);
    }
  }, []);

  useEffect(() => {
    // Loads users after mount (async → setState off the render path).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function create() {
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      setError(data.error ?? "Não foi possível convidar o usuário.");
      return;
    }
    setForm({ name: "", email: "", password: "", role: ROLES[1] });
    setShowForm(false);
    load();
  }

  async function changeRole(id: number, role: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) setError(data.error ?? "Não foi possível alterar o papel.");
    load();
  }

  async function remove(id: number) {
    if (!window.confirm("Remover este usuário?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) setError(data.error ?? "Não foi possível remover.");
    load();
  }

  if (!isAdmin) {
    return (
      <>
        <PageHeader title="Usuários administrativos" />
        <Card>
          <p className="text-[14px] text-adm-muted">
            Apenas o <strong>Administrador geral</strong> pode gerenciar usuários.
            Você está conectado como <strong>{user?.role}</strong>.
          </p>
        </Card>
      </>
    );
  }

  if (rows === null) return <AdmLoading />;

  return (
    <>
      <PageHeader
        title="Usuários administrativos"
        aside={
          <PrimaryButton onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancelar" : "+ Convidar usuário"}
          </PrimaryButton>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-[#e0b4b0] bg-[#fdf2f1] px-3.5 py-2.5 text-[13px] text-[#c0392b]">
          {error}
        </div>
      )}

      {showForm && (
        <Card className="mb-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Nome</FieldLabel>
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <FieldLabel>E-mail</FieldLabel>
              <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Senha (mín. 6)</FieldLabel>
              <TextInput type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Permissão</FieldLabel>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <PrimaryButton onClick={create}>Criar usuário</PrimaryButton>
          </div>
        </Card>
      )}

      <div className="overflow-hidden rounded-lg border border-adm-border bg-adm-card">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_120px] gap-3 border-b border-[#eee] px-5 py-3 text-[12px] font-bold text-adm-muted md:grid">
          <div>NOME / E-MAIL</div>
          <div>PERMISSÃO</div>
          <div>ÚLTIMO ACESSO</div>
          <div>AÇÕES</div>
        </div>
        {rows.map((u) => (
          <div
            key={u.id}
            className="grid grid-cols-1 gap-3 border-b border-adm-line px-5 py-4 md:grid-cols-[1.4fr_1fr_1fr_120px] md:items-center md:gap-3"
          >
            <div>
              <div className="text-[14px] font-semibold">{u.name}</div>
              <div className="text-[12px] text-[#999]">{u.email}</div>
            </div>
            <Select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
            <div className="text-[13px] text-[#777]">{u.last_access ?? "—"}</div>
            <div className="flex gap-2">
              <GhostButton onClick={() => remove(u.id)}>Remover</GhostButton>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-5 py-6 text-[13px] text-adm-muted">Nenhum usuário.</div>
        )}
      </div>

      <div className="mt-6 text-[13px] text-adm-muted">
        Níveis de acesso: <strong>Administrador geral</strong> (controle total, gerencia
        usuários) e <strong>Editor de conteúdo</strong> (edita textos, galeria e banner).
      </div>
    </>
  );
}

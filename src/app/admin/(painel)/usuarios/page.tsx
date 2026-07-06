"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { AdminUser, AdminRole } from "@/lib/content/types";
import {
  AdmLoading,
  GhostButton,
  PageHeader,
  PrimaryButton,
  SaveBar,
  Select,
  TextInput,
} from "@/components/admin/ui";

const ROLES: AdminRole[] = ["Administrador geral", "Editor de conteúdo"];

function UsuariosForm({ initial }: { initial: AdminUser[] }) {
  const { save } = useContent();
  const [rows, setRows] = useState<AdminUser[]>(initial);

  function set(i: number, patch: Partial<AdminUser>) {
    setRows((r) => r.map((u, idx) => (idx === i ? { ...u, ...patch } : u)));
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }
  function add() {
    setRows((r) => [
      ...r,
      {
        name: "Novo usuário",
        email: "email@run4brasilafrica.com",
        role: "Editor de conteúdo",
        lastAccess: "—",
      },
    ]);
  }

  return (
    <>
      <PageHeader
        title="Usuários administrativos"
        aside={<PrimaryButton onClick={add}>+ Convidar usuário</PrimaryButton>}
      />

      <div className="overflow-hidden rounded-lg border border-adm-border bg-adm-card">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_120px] gap-3 border-b border-[#eee] px-5 py-3 text-[12px] font-bold text-adm-muted md:grid">
          <div>NOME / E-MAIL</div>
          <div>PERMISSÃO</div>
          <div>ÚLTIMO ACESSO</div>
          <div>AÇÕES</div>
        </div>

        {rows.map((u, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-3 border-b border-adm-line px-5 py-4 md:grid-cols-[1.4fr_1fr_1fr_120px] md:items-center md:gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <TextInput
                value={u.name}
                onChange={(e) => set(i, { name: e.target.value })}
              />
              <TextInput
                value={u.email}
                onChange={(e) => set(i, { email: e.target.value })}
                className="text-[12px] text-[#999]"
              />
            </div>
            <Select
              value={u.role}
              onChange={(e) => set(i, { role: e.target.value as AdminRole })}
            >
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
            <div className="text-[13px] text-[#777]">{u.lastAccess}</div>
            <div className="flex gap-2">
              <GhostButton onClick={() => remove(i)}>Remover</GhostButton>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-[13px] text-adm-muted">
        Níveis de acesso: <strong>Administrador geral</strong> (controle total) e{" "}
        <strong>Editor de conteúdo</strong> (textos, galeria e banner).
      </div>

      <SaveBar
        onSave={() => save({ users: rows }, "Atualizou usuários administrativos")}
      />
    </>
  );
}

export default function UsuariosPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <UsuariosForm initial={content.users} />;
}

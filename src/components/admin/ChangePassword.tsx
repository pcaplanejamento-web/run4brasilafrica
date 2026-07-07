"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import {
  Card,
  FieldLabel,
  PrimaryButton,
  SectionLabel,
  TextInput,
} from "./ui";

/** "Trocar minha senha" — verifies the current password server-side. */
export default function ChangePassword() {
  const { user, configured } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured || !user) return null;

  async function submit() {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setMsg({ ok: true, text: "Senha alterada." });
        setCurrent("");
        setNext("");
      } else {
        setMsg({ ok: false, text: data.error ?? "Não foi possível trocar a senha." });
      }
    } catch {
      setMsg({ ok: false, text: "Falha de conexão." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionLabel>Minha senha</SectionLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Senha atual</FieldLabel>
          <TextInput type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Nova senha (mín. 6)</FieldLabel>
          <TextInput type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        {msg && (
          <span
            className="text-[13px] font-semibold"
            style={{ color: msg.ok ? "#4a9d5f" : "#c0392b" }}
          >
            {msg.text}
          </span>
        )}
        <PrimaryButton onClick={submit} disabled={busy}>
          {busy ? "Salvando..." : "Trocar senha"}
        </PrimaryButton>
      </div>
    </Card>
  );
}

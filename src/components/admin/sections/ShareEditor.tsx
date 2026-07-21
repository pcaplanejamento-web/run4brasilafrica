"use client";

import type { ShareSection } from "@/lib/content/types";
import { Card, FieldLabel, SectionLabel, TextArea, TextInput } from "@/components/admin/ui";

/** Editor controlado da seção "Compartilhe o evento" (`ShareSection`). */
export function ShareEditor({
  value,
  onChange,
}: {
  value: ShareSection;
  onChange: (next: ShareSection) => void;
}) {
  const share = value ?? {};
  const set = (patch: Partial<ShareSection>) => onChange({ ...share, ...patch });
  return (
    <Card>
      <SectionLabel>Seção &ldquo;Compartilhe o evento&rdquo;</SectionLabel>
      <p className="mb-3 text-[12px] text-adm-muted">
        Botões para o visitante divulgar o evento (WhatsApp, compartilhar nativo, Facebook, X e
        copiar link).
      </p>
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel>Título</FieldLabel>
          <TextInput
            value={share.title ?? ""}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Compartilhe o evento"
          />
        </div>
        <div>
          <FieldLabel>Legenda</FieldLabel>
          <TextInput
            value={share.subtitle ?? ""}
            onChange={(e) => set({ subtitle: e.target.value })}
            placeholder="Chame a galera para correr por uma causa maior."
          />
        </div>
        <div>
          <FieldLabel>Mensagem compartilhada (opcional)</FieldLabel>
          <TextArea
            value={share.message ?? ""}
            onChange={(e) => set({ message: e.target.value })}
            rows={3}
            placeholder="Vazio = gerada automaticamente com o nome, a chamada e a data do evento."
          />
          <div className="mt-1 text-[12px] text-adm-muted">
            O link do site é adicionado automaticamente.
          </div>
        </div>
      </div>
    </Card>
  );
}

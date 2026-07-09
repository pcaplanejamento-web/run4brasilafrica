"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { ShareSection } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  PageHeader,
  SaveBar,
  SectionLabel,
  TextArea,
  TextInput,
} from "@/components/admin/ui";

function CompartilharForm({ initial }: { initial: ShareSection }) {
  const { save } = useContent();
  const [share, setShare] = useState<ShareSection>(initial);
  const set = (patch: Partial<ShareSection>) => setShare((s) => ({ ...s, ...patch }));

  return (
    <>
      <PageHeader title="Compartilhar" />

      <div className="max-w-[760px]">
        <Card>
          <SectionLabel>Seção &ldquo;Compartilhe o evento&rdquo;</SectionLabel>
          <p className="mb-3 text-[12px] text-adm-muted">
            Botões para o visitante divulgar o evento (WhatsApp, compartilhar nativo — que no
            celular oferece Instagram/Stories —, Facebook, X e copiar link).
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
                Texto que vai junto no compartilhamento. O link do site é adicionado
                automaticamente.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="max-w-[760px]">
        <SaveBar onSave={() => save({ share }, "Atualizou o compartilhar")} />
      </div>
    </>
  );
}

export default function CompartilharPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <CompartilharForm initial={content.share ?? {}} />;
}

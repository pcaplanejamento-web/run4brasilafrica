"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { ContactLinks, Inscricao } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  FieldLabel,
  PageTitle,
  SaveBar,
  SectionLabel,
  TextInput,
} from "@/components/admin/ui";

function LinksForm({
  initialInscricao,
  initialContact,
}: {
  initialInscricao: Inscricao;
  initialContact: ContactLinks;
}) {
  const { save } = useContent();
  const [inscricao, setInscricao] = useState(initialInscricao);
  const [contact, setContact] = useState(initialContact);

  return (
    <>
      <div className="mb-7">
        <PageTitle>Links & inscrição</PageTitle>
      </div>

      <div className="flex max-w-[760px] flex-col gap-5">
        <Card>
          <SectionLabel>Inscrição</SectionLabel>
          <FieldLabel>Plataforma</FieldLabel>
          <div className="mb-3.5">
            <TextInput
              value={inscricao.platform}
              onChange={(e) =>
                setInscricao({ ...inscricao, platform: e.target.value })
              }
            />
          </div>
          <FieldLabel>URL de inscrição</FieldLabel>
          <TextInput
            value={inscricao.url}
            onChange={(e) => setInscricao({ ...inscricao, url: e.target.value })}
          />
        </Card>

        <Card>
          <SectionLabel>Redes sociais</SectionLabel>
          {(
            [
              ["Instagram", "instagram"],
              ["WhatsApp", "whatsapp"],
              ["YouTube", "youtube"],
              ["E-mail de contato", "email"],
            ] as const
          ).map(([label, key]) => (
            <div
              key={key}
              className="mb-3 grid grid-cols-1 items-center gap-2 sm:grid-cols-[130px_1fr]"
            >
              <FieldLabel>{label}</FieldLabel>
              <TextInput
                value={contact[key]}
                onChange={(e) => setContact({ ...contact, [key]: e.target.value })}
              />
            </div>
          ))}
        </Card>

        <Card>
          <SectionLabel>Doações</SectionLabel>
          <TextInput
            value={contact.donationsUrl}
            onChange={(e) =>
              setContact({ ...contact, donationsUrl: e.target.value })
            }
          />
        </Card>
      </div>

      <div className="max-w-[760px]">
        <SaveBar
          onSave={() =>
            save({ inscricao, contact }, "Atualizou links & inscrição")
          }
        />
      </div>
    </>
  );
}

export default function LinksPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return (
    <LinksForm
      initialInscricao={content.inscricao}
      initialContact={content.contact}
    />
  );
}

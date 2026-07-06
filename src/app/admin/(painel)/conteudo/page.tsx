"use client";

import { useState } from "react";
import { useContent } from "@/lib/content/store";
import type { ContentSection } from "@/lib/content/types";
import {
  AdmLoading,
  Card,
  PageTitle,
  SaveBar,
  TextArea,
} from "@/components/admin/ui";

const TOOLBAR = ["B", "I", "Link", "Lista"];

function ConteudoForm({ initial }: { initial: ContentSection[] }) {
  const { save } = useContent();
  const [draft, setDraft] = useState(initial);

  function setBody(i: number, body: string) {
    setDraft((prev) => prev.map((s, idx) => (idx === i ? { ...s, body } : s)));
  }

  return (
    <>
      <div className="mb-7">
        <PageTitle>Textos do site</PageTitle>
      </div>

      <div className="flex flex-col gap-5">
        {draft.map((s, i) => (
          <Card key={s.title}>
            <div className="mb-3 text-[13px] font-bold uppercase text-adm-muted">
              {s.title}
            </div>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {TOOLBAR.map((t) => (
                <span
                  key={t}
                  className="rounded border border-[#ddd] px-2.5 py-1 text-[12px] font-bold"
                  style={{ fontStyle: t === "I" ? "italic" : undefined }}
                >
                  {t}
                </span>
              ))}
            </div>
            <TextArea
              rows={3}
              value={s.body}
              onChange={(e) => setBody(i, e.target.value)}
              className="min-h-[70px]"
            />
          </Card>
        ))}
      </div>

      <SaveBar
        onSave={() => save({ contentSections: draft }, "Atualizou textos do site")}
      />
    </>
  );
}

export default function ConteudoPage() {
  const { hydrated, content } = useContent();
  if (!hydrated) return <AdmLoading />;
  return <ConteudoForm initial={content.contentSections} />;
}

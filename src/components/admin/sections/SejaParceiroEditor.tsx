"use client";

import type { SejaParceiroSection } from "@/lib/content/types";
import {
  Card,
  FieldLabel,
  SectionLabel,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/ui";

const ASPECT_OPTIONS = [
  { value: "16/9", label: "16:9 (widescreen)" },
  { value: "4/3", label: "4:3 (paisagem)" },
  { value: "1/1", label: "1:1 (quadrado)" },
  { value: "3/4", label: "3:4 (retrato)" },
  { value: "9/16", label: "9:16 (Reels)" },
  { value: "21/9", label: "21:9 (cinema)" },
];

/**
 * Editor controlado da seção "Seja um Parceiro" (`SejaParceiroSection`) — apenas
 * o CONTEÚDO (textos + vídeo). Os cadastros recebidos (CRM) ficam na página
 * /admin/seja-parceiro (não são conteúdo da seção).
 */
export function SejaParceiroEditor({
  value,
  onChange,
}: {
  value: SejaParceiroSection;
  onChange: (next: SejaParceiroSection) => void;
}) {
  const cfg = value ?? {};
  const set = (patch: Partial<SejaParceiroSection>) => onChange({ ...cfg, ...patch });
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionLabel>Texto da seção no site</SectionLabel>
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <FieldLabel>Título</FieldLabel>
            <TextInput value={cfg.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Legenda / chamada</FieldLabel>
            <TextArea
              value={cfg.subtitle ?? ""}
              onChange={(e) => set({ subtitle: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <FieldLabel>Notificar novos cadastros em (e-mail)</FieldLabel>
            <TextInput
              type="email"
              value={cfg.notifyEmail ?? ""}
              onChange={(e) => set({ notifyEmail: e.target.value })}
              placeholder="organizacao@run4brasilafrica.com.br"
            />
            <div className="mt-1 text-[12px] text-adm-muted">
              Opcional. Aviso por e-mail a cada novo cadastro (requer a chave de envio no servidor).
              Os cadastros recebidos ficam em <strong>Cadastros de parceiros</strong>.
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionLabel>Vídeo promocional</SectionLabel>
            <div className="mt-1 text-[12px] text-adm-muted">
              Ativado: à esquerda do formulário (desktop) / acima dele (mobile).
            </div>
          </div>
          <div className="w-[150px]">
            <Select
              value={cfg.videoEnabled ? "sim" : "nao"}
              onChange={(e) => set({ videoEnabled: e.target.value === "sim" })}
            >
              <option value="nao">Desativado</option>
              <option value="sim">Ativado</option>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-adm-line pt-4">
          <div>
            <FieldLabel>Link do vídeo no YouTube</FieldLabel>
            <TextInput
              value={cfg.videoUrl ?? ""}
              onChange={(e) => set({ videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Proporção</FieldLabel>
              <Select
                value={cfg.aspectRatio ?? "16/9"}
                onChange={(e) => set({ aspectRatio: e.target.value })}
              >
                {ASPECT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel>Exibição</FieldLabel>
              <Select
                value={cfg.clickToPlay ? "click" : "auto"}
                onChange={(e) => set({ clickToPlay: e.target.value === "click" })}
              >
                <option value="auto">Tocar automático (mudo)</option>
                <option value="click">Clique para começar</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Iniciar com som?</FieldLabel>
              <Select
                value={cfg.videoStartMuted === false ? "sim" : "nao"}
                onChange={(e) => set({ videoStartMuted: e.target.value !== "sim" })}
              >
                <option value="nao">Não — começa mudo</option>
                <option value="sim">Sim — som ao interagir</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Controles do YouTube</FieldLabel>
              <Select
                value={cfg.videoControls ? "sim" : "nao"}
                onChange={(e) => set({ videoControls: e.target.value === "sim" })}
              >
                <option value="nao">Ocultar (só o vídeo)</option>
                <option value="sim">Mostrar (play/pausa, tela cheia, compartilhar, logo)</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Legendas</FieldLabel>
              <Select
                value={cfg.videoCaptions ? "sim" : "nao"}
                onChange={(e) => set({ videoCaptions: e.target.value === "sim" })}
              >
                <option value="nao">Não mostrar</option>
                <option value="sim">Mostrar legendas</option>
              </Select>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

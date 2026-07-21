"use client";

import type { CSSProperties } from "react";
import { useContent } from "@/lib/content/store";

/**
 * Shared ADM UI primitives — light terracotta admin theme (ported from the
 * ADM *.dc.html prototypes). Real form controls so pages are functional.
 */

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[20px] font-bold text-adm-ink md:text-[22px]">
      {children}
    </h1>
  );
}

export function PageHeader({
  title,
  aside,
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:mb-7">
      <PageTitle>{title}</PageTitle>
      {aside}
    </div>
  );
}

export function Card({
  children,
  dashed = false,
  className = "",
  style,
}: {
  children: React.ReactNode;
  dashed?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-lg bg-adm-card p-5 md:p-6 ${
        dashed
          ? "border border-dashed border-[#b8b8b0]"
          : "border border-adm-border"
      } ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3.5 text-[13px] font-bold uppercase text-adm-muted">
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[13px] text-[#555]">{children}</label>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className={`w-full rounded border border-[#ccc] bg-[#fbfbfa] px-3 py-2.5 text-[14px] text-adm-ink outline-none transition-colors focus:border-terracotta ${
        props.className ?? ""
      }`}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={`w-full rounded border border-[#ccc] bg-[#fbfbfa] p-3.5 text-[14px] leading-[1.6] text-[#444] outline-none transition-colors focus:border-terracotta ${
        props.className ?? ""
      }`}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      {...props}
      className={`w-full rounded border border-[#ccc] bg-[#fbfbfa] px-2.5 py-2 text-[14px] text-adm-ink outline-none transition-colors focus:border-terracotta ${
        props.className ?? ""
      }`}
    />
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`min-h-11 rounded-md bg-terracotta px-6 py-3 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 md:px-7 ${
        props.className ?? ""
      }`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`min-h-9 rounded border border-[#ccc] bg-white px-3 py-1.5 text-[12px] text-adm-ink transition-colors hover:border-terracotta hover:text-terracotta ${
        props.className ?? ""
      }`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  bg,
  color,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-[12px] font-bold"
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
}

/**
 * Save bar wired to the content store: shows saving / saved / error / local-only
 * state directly from the backend round-trip.
 */
export function SaveBar({
  onSave,
  label = "Salvar alterações",
  disabled = false,
  blockedNote,
}: {
  onSave: () => void;
  label?: string;
  /** Bloqueia o save (ex.: validação com erros). */
  disabled?: boolean;
  /** Mensagem mostrada quando `disabled` por validação. */
  blockedNote?: React.ReactNode;
}) {
  const { status, error, localOnly } = useContent();

  let note: React.ReactNode = null;
  if (status === "saving") {
    note = <span className="text-[13px] text-adm-muted">Salvando...</span>;
  } else if (status === "saved") {
    note = (
      <span className="text-[13px] font-semibold text-[#4a9d5f]">
        {localOnly ? "Salvo localmente" : "Alterações salvas"}
      </span>
    );
  } else if (status === "error") {
    note = (
      <span className="text-[13px] font-semibold text-[#c0392b]">
        {error ?? "Erro ao salvar"}
      </span>
    );
  }

  return (
    <div className="mt-6 flex items-center justify-end gap-3">
      {disabled && blockedNote ? (
        <span className="text-[13px] font-semibold text-[#c0392b]">{blockedNote}</span>
      ) : (
        note
      )}
      <PrimaryButton onClick={onSave} disabled={status === "saving" || disabled}>
        {label}
      </PrimaryButton>
    </div>
  );
}

/** Loading placeholder shown while the store hydrates from the backend. */
export function AdmLoading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-[14px] text-adm-muted">
      {label}
    </div>
  );
}

/** Placeholder graphic block used where a photo/logo will go. */
export function ImagePlaceholder({
  className = "",
  size = 8,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={className}
      style={{
        background: `repeating-linear-gradient(45deg,#ddd 0 ${size}px,#e8e8e2 ${size}px ${size * 2}px)`,
      }}
    />
  );
}

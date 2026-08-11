"use client";

import type { RaceResultRow } from "@/lib/content/types";
import { parseResultsCsv } from "./parse";

/** Sanitiza o id da categoria (mesma regra da rota) — evita chaves inválidas. */
export function sanitizeCatId(id: string): string {
  return (id || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
}

/**
 * Lê um arquivo CSV no navegador com **fallback de encoding**: tenta UTF-8 e, se
 * aparecer o caractere de substituição (mojibake — típico de export
 * Windows-1252/Latin-1 da cronometragem), refaz a decodificação como
 * windows-1252. Devolve as linhas já parseadas.
 */
export async function readResultsFile(file: File): Promise<RaceResultRow[]> {
  const buf = await file.arrayBuffer();
  let text = new TextDecoder("utf-8").decode(buf);
  if (text.includes("�")) {
    try {
      text = new TextDecoder("windows-1252").decode(buf);
    } catch {
      /* mantém o UTF-8 se o runtime não suportar windows-1252 */
    }
  }
  return parseResultsCsv(text);
}

/** Busca (pública) as linhas de uma categoria. Devolve `[]` quando não há. */
export async function fetchResults(catId: string): Promise<RaceResultRow[]> {
  const id = sanitizeCatId(catId);
  if (!id) return [];
  const r = await fetch(`/api/results?cat=${encodeURIComponent(id)}`);
  if (!r.ok) return [];
  const d = (await r.json()) as { ok: boolean; rows?: RaceResultRow[] };
  return d.ok && Array.isArray(d.rows) ? d.rows : [];
}

export interface SaveResult {
  ok: boolean;
  count?: number;
  error?: string;
  code?: string;
}

/** Grava (admin) as linhas de uma categoria no servidor (KV). */
export async function saveResults(catId: string, rows: RaceResultRow[]): Promise<SaveResult> {
  const id = sanitizeCatId(catId);
  if (!id) return { ok: false, error: "categoria inválida" };
  try {
    const r = await fetch("/api/results", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cat: id, rows }),
    });
    const d = (await r.json()) as SaveResult;
    return d;
  } catch {
    return { ok: false, error: "Falha de conexão." };
  }
}

/** Remove (admin) as linhas de uma categoria do servidor (KV). */
export async function deleteResults(catId: string): Promise<boolean> {
  const id = sanitizeCatId(catId);
  if (!id) return false;
  try {
    const r = await fetch(`/api/results?cat=${encodeURIComponent(id)}`, { method: "DELETE" });
    const d = (await r.json()) as { ok: boolean };
    return !!d.ok;
  } catch {
    return false;
  }
}

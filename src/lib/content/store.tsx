"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { LogEntry, SiteContent, StoredContent } from "./types";
import { seedContent } from "./seed";
import { normalizeContent } from "./migrate";
import { resolveEdition } from "./resolve";
import { activeEdition } from "./editions";
import { routePatch } from "./route";

/**
 * ADM content store (multi-tenant).
 *
 * Guarda o conteúdo **cru** (`StoredContent`: globais + `editions[]`) e a **edição
 * selecionada** no ADM. `content` exposto é a **view resolvida** dessa edição
 * (`resolveEdition`), com a mesma forma de `SiteContent` — as telas do ADM leem
 * `content.event/layout/customSections/...` sem alteração. `save(patch)` roteia
 * as chaves: as por-edição (`event`/`layout`/`customSections`) para a edição
 * selecionada, `editions` e as globais para o topo. Persiste tudo via
 * `/api/content` (Cloudflare D1) com cópia em localStorage (offline/dev).
 */

const CACHE_KEY = "r4ba:content:v3";
const SEL_KEY = "r4ba:edition:v1";

export type SaveStatus = "loading" | "idle" | "saving" | "saved" | "error";
export type Backend = "backend" | "seed" | "unset" | "error" | "local";

/** Seed migrado para o modelo multi-tenant (cliente). */
const seedStored: StoredContent = normalizeContent(seedContent);

interface ContentContextValue {
  /** View resolvida da edição selecionada (mesma forma de SiteContent). */
  content: SiteContent;
  /** Conteúdo cru persistido (globais + edições) — para backup/export. */
  stored: StoredContent;
  /** Id da edição selecionada no ADM (default = ativa). */
  selectedEditionId: string | null;
  /** Troca a edição sendo editada (sidebar). */
  selectEdition: (id: string) => void;
  /** True once the initial load (server or cache) has completed. */
  hydrated: boolean;
  status: SaveStatus;
  error: string | null;
  backend: Backend;
  localOnly: boolean;
  /** Apply a patch (roteado por edição/global) and persist it (optimistic). */
  save: (patch: Partial<SiteContent>, logAction?: string) => Promise<boolean>;
  /** Substitui TODO o conteúdo cru (importar backup). */
  restore: (raw: Partial<SiteContent>, logAction?: string) => Promise<boolean>;
  reload: () => Promise<void>;
  reset: () => Promise<boolean>;
}

const ContentContext = createContext<ContentContextValue | null>(null);

function readCache(): StoredContent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? normalizeContent(JSON.parse(raw) as Partial<SiteContent>) : null;
  } catch {
    return null;
  }
}

function writeCache(content: StoredContent) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(content));
  } catch {
    /* storage may be unavailable (private mode) — non-fatal */
  }
}

function readSelected(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SEL_KEY);
  } catch {
    return null;
  }
}

function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

/** Aplica um patch roteando as chaves por-edição/global e carimba o log. */
function applyPatch(
  base: StoredContent,
  editionId: string | null,
  patch: Partial<SiteContent>,
  logAction?: string,
): StoredContent {
  const next = routePatch(base, editionId, patch);
  if (logAction) {
    const entry: LogEntry = { time: nowStamp(), action: logAction, user: "Você" };
    next.log = [entry, ...(base.log ?? [])].slice(0, 50);
  }
  return next;
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useState<StoredContent>(seedStored);
  const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [backend, setBackend] = useState<Backend>("unset");

  // Mirrors so async callbacks read the latest without stale closures.
  const storedRef = useRef(stored);
  useEffect(() => {
    storedRef.current = stored;
  }, [stored]);
  const selRef = useRef(selectedEditionId);
  useEffect(() => {
    selRef.current = selectedEditionId;
  }, [selectedEditionId]);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A edição efetiva: a selecionada (se existir) ou a ativa.
  const effectiveEditionId = useMemo(() => {
    const eds = stored.editions ?? [];
    if (selectedEditionId && eds.some((e) => e.id === selectedEditionId)) {
      return selectedEditionId;
    }
    return activeEdition(stored)?.id ?? null;
  }, [stored, selectedEditionId]);

  const content = useMemo(
    () => resolveEdition(stored, effectiveEditionId ?? undefined),
    [stored, effectiveEditionId],
  );

  const applyServer = useCallback(async () => {
    try {
      const res = await fetch("/api/content", {
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });
      const data = (await res.json()) as {
        ok: boolean;
        content: StoredContent;
        source: Backend;
      };
      if (data?.source === "backend" && data.content) {
        const norm = normalizeContent(data.content);
        setStored(norm);
        writeCache(norm);
      }
      setBackend(data?.source ?? "error");
    } catch {
      setBackend("error");
    }
  }, []);

  // Initial load: paint cache instantly, then reconcile with the server.
  useEffect(() => {
    const cached = readCache();
    const sel = readSelected();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sel) setSelectedEditionId(sel);
    if (cached) setStored(cached);
    applyServer().finally(() => {
      setHydrated(true);
      setStatus("idle");
    });
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, [applyServer]);

  const flashSaved = useCallback(() => {
    setStatus("saved");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setStatus("idle"), 3000);
  }, []);

  const selectEdition = useCallback((id: string) => {
    setSelectedEditionId(id);
    try {
      window.localStorage.setItem(SEL_KEY, id);
    } catch {
      /* non-fatal */
    }
  }, []);

  // Persiste um `StoredContent` já montado (usado por save/restore/reset).
  const persist = useCallback(
    async (next: StoredContent) => {
      setStored(next);
      writeCache(next);
      setStatus("saving");
      setError(null);
      try {
        const res = await fetch("/api/content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: next }),
        });
        const data = (await res.json()) as { ok: boolean; code?: string; error?: string };
        if (!data.ok && data.code === "not_configured") {
          setBackend("local");
          flashSaved();
          return true;
        }
        if (!res.ok || !data.ok) throw new Error(data.error ?? "Falha ao salvar no backend");
        setBackend("backend");
        flashSaved();
        return true;
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [flashSaved],
  );

  const save = useCallback(
    async (patch: Partial<SiteContent>, logAction?: string) => {
      const next = applyPatch(storedRef.current, selRef.current, patch, logAction);
      return persist(next);
    },
    [persist],
  );

  const restore = useCallback(
    async (raw: Partial<SiteContent>, logAction?: string) => {
      const next = normalizeContent(raw);
      if (logAction) {
        next.log = [
          { time: nowStamp(), action: logAction, user: "Você" },
          ...(next.log ?? []),
        ].slice(0, 50);
      }
      return persist(next);
    },
    [persist],
  );

  const reset = useCallback(async () => {
    setStored(seedStored);
    writeCache(seedStored);
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = (await res.json()) as { ok: boolean; code?: string; error?: string };
      if (!data.ok && data.code === "not_configured") {
        setBackend("local");
        flashSaved();
        return true;
      }
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Falha ao restaurar");
      setBackend("backend");
      flashSaved();
      return true;
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  }, [flashSaved]);

  const reload = useCallback(async () => {
    setStatus("loading");
    await applyServer();
    setStatus("idle");
  }, [applyServer]);

  const value = useMemo<ContentContextValue>(
    () => ({
      content,
      stored,
      selectedEditionId: effectiveEditionId,
      selectEdition,
      hydrated,
      status,
      error,
      backend,
      localOnly: backend === "local" || backend === "unset",
      save,
      restore,
      reload,
      reset,
    }),
    [
      content,
      stored,
      effectiveEditionId,
      selectEdition,
      hydrated,
      status,
      error,
      backend,
      save,
      restore,
      reload,
      reset,
    ],
  );

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
}

export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) {
    throw new Error("useContent must be used within a <ContentProvider>");
  }
  return ctx;
}

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
import type { SiteContent, LogEntry } from "./types";
import { seedContent } from "./seed";

/**
 * ADM content store.
 *
 * Reads/writes through the same-origin `/api/content` route, which proxies the
 * Google Apps Script backend (token stays server-side). A localStorage copy is
 * kept as an offline cache and as the persistence layer when no backend is
 * configured, so the ADM is always usable.
 */

const CACHE_KEY = "r4ba:content:v2";

export type SaveStatus = "loading" | "idle" | "saving" | "saved" | "error";
export type Backend = "backend" | "seed" | "unset" | "error" | "local";

interface ContentContextValue {
  content: SiteContent;
  /** True once the initial load (server or cache) has completed. */
  hydrated: boolean;
  status: SaveStatus;
  error: string | null;
  /** Where the current content came from / where saves are going. */
  backend: Backend;
  /** True when saves are persisting to localStorage only (no backend). */
  localOnly: boolean;
  /** Apply a patch and persist it (optimistic). Returns success. */
  save: (patch: Partial<SiteContent>, logAction?: string) => Promise<boolean>;
  /** Re-fetch content from the backend. */
  reload: () => Promise<void>;
  /** Restore the default seed content (and clear the backend). */
  reset: () => Promise<boolean>;
}

const ContentContext = createContext<ContentContextValue | null>(null);

function readCache(): SiteContent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? ({ ...seedContent, ...JSON.parse(raw) } as SiteContent) : null;
  } catch {
    return null;
  }
}

function writeCache(content: SiteContent) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(content));
  } catch {
    /* storage may be unavailable (private mode) — non-fatal */
  }
}

function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

function withLog(
  base: SiteContent,
  patch: Partial<SiteContent>,
  logAction?: string,
): SiteContent {
  const next: SiteContent = { ...base, ...patch };
  if (logAction) {
    const entry: LogEntry = { time: nowStamp(), action: logAction, user: "Você" };
    next.log = [entry, ...base.log].slice(0, 50);
  }
  return next;
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteContent>(seedContent);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [backend, setBackend] = useState<Backend>("unset");

  // Mirror of content so async save() can read the latest without stale closures.
  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyServer = useCallback(async () => {
    try {
      const res = await fetch("/api/content", {
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      });
      const data = (await res.json()) as {
        ok: boolean;
        content: SiteContent;
        source: Backend;
      };
      // Only the real backend is authoritative. When it's unset/empty/errored,
      // the local cache is the source of truth — never clobber it with the
      // seed the API returns as a placeholder (would drop local-only edits).
      if (data?.source === "backend" && data.content) {
        setContent(data.content);
        writeCache(data.content);
      }
      setBackend(data?.source ?? "error");
    } catch {
      // Keep whatever we already have (cache/seed); mark backend unreachable.
      setBackend("error");
    }
  }, []);

  // Initial load: paint cache instantly, then reconcile with the server.
  useEffect(() => {
    const cached = readCache();
    // Paint cached content instantly before the network resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cached) setContent(cached);
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

  const save = useCallback(
    async (patch: Partial<SiteContent>, logAction?: string) => {
      const next = withLog(contentRef.current, patch, logAction);
      // Optimistic: update UI + cache immediately.
      setContent(next);
      writeCache(next);
      setStatus("saving");
      setError(null);

      try {
        const res = await fetch("/api/content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: next }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          code?: string;
          error?: string;
        };

        if (!data.ok && data.code === "not_configured") {
          // No backend: local cache is the source of truth. Not an error.
          setBackend("local");
          flashSaved();
          return true;
        }
        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? "Falha ao salvar no backend");
        }
        setBackend("backend");
        flashSaved();
        return true;
      } catch (err) {
        // Local change is kept (already cached) so nothing is lost.
        setStatus("error");
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [flashSaved],
  );

  const reset = useCallback(async () => {
    setContent(seedContent);
    writeCache(seedContent);
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
      hydrated,
      status,
      error,
      backend,
      localOnly: backend === "local" || backend === "unset",
      save,
      reload,
      reset,
    }),
    [content, hydrated, status, error, backend, save, reload, reset],
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

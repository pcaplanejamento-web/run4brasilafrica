"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export interface SessionUser {
  email: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  /** True when a backend/auth is configured (live). False in local dev (open). */
  configured: boolean;
  ready: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Gates the ADM: checks the session via /api/auth/me. When auth is configured
 * and there is no session, redirects to the login page. In local dev (no
 * binding) auth is not configured, so the panel stays open.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [configured, setConfigured] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as {
        configured?: boolean;
        user?: SessionUser | null;
      };
      setConfigured(!!data.configured);
      setUser(data.user ?? null);
    } catch {
      setConfigured(false);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    // Loads the session after mount (async → setState happens off the render path).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (ready && configured && !user) router.replace("/admin/login");
  }, [ready, configured, user, router]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setUser(null);
    router.replace("/admin/login");
  }, [router]);

  if (!ready || (configured && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-adm-bg font-sans text-[14px] text-adm-muted">
        Carregando...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, configured, ready, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

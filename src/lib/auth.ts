import "server-only";
import { cookies } from "next/headers";
import { getDB } from "@/lib/cf";

/**
 * Authentication: users + sessions in Cloudflare D1.
 * Passwords are PBKDF2-SHA256 (Web Crypto), sessions are opaque tokens stored in
 * D1 and carried in an HttpOnly cookie.
 */

export const SESSION_COOKIE = "r4ba_session";
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days (seconds)
const PBKDF2_ITERATIONS = 100_000;

export type Role = "Administrador geral" | "Editor de conteúdo";
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

const enc = new TextEncoder();
const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password) as BufferSource,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS, 32);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1], 10);
  const salt = fromB64(parts[2]);
  const expected = fromB64(parts[3]);
  const actual = await pbkdf2(password, salt, iterations, expected.length);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

/** True when the D1 binding exists (auth enforced). Local dev → false (open). */
export function authConfigured(): boolean {
  return getDB() !== null;
}

function newToken(): string {
  return (
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "")
  );
}

export async function createSession(userId: number): Promise<{ token: string; maxAge: number } | null> {
  const db = getDB();
  if (!db) return null;
  const token = newToken();
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL;
  await db
    .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?1, ?2, ?3)")
    .bind(token, userId, expires)
    .run();
  return { token, maxAge: SESSION_TTL };
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const db = getDB();
  if (!db) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await db
    .prepare(
      "SELECT s.expires_at AS expires_at, u.id AS id, u.email AS email, u.name AS name, u.role AS role " +
        "FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?1",
    )
    .bind(token)
    .first<{ expires_at: number; id: number; email: string; name: string; role: Role }>();
  if (!row) return null;
  if (row.expires_at < Math.floor(Date.now() / 1000)) {
    await db.prepare("DELETE FROM sessions WHERE token = ?1").bind(token).run();
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export async function destroySession(): Promise<void> {
  const db = getDB();
  if (!db) return;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.prepare("DELETE FROM sessions WHERE token = ?1").bind(token).run();
  }
}

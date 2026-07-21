/** Id curto e único (8 chars) para blocos/abas/lotes criados no ADM. */
export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
}

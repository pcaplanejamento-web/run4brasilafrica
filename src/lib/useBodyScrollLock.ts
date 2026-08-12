"use client";

import { useEffect } from "react";

/**
 * Trava o scroll do `body` enquanto `active` for true, com **contador** — assim
 * modais empilhados (ex.: "classificação geral" + página do corredor) não
 * destravam o scroll ao fechar só um. Restaura o valor original quando o último
 * lock sai.
 */
let locks = 0;
let previous = "";

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (locks === 0) {
      previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    locks += 1;
    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) document.body.style.overflow = previous;
    };
  }, [active]);
}

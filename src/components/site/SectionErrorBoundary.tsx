"use client";

import { Component, type ReactNode } from "react";

/**
 * Isola falhas de renderização de UMA seção: se um componente lançar erro, a
 * seção some (ou mostra um fallback discreto) em vez de derrubar a página toda.
 * React exige um **class component** para `getDerivedStateFromError`.
 */
export default class SectionErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Log para diagnóstico; não propaga (o boundary contém a falha).
    console.error("[section] erro de renderização:", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdmLoading } from "@/components/admin/ui";

/**
 * "Textos do site" foi removida. Os textos passaram a ser editados nas
 * respectivas abas ("A Causa", "Perguntas frequentes") e na config geral
 * (contato/rodapé em "Links & inscrição"). Rota antiga redireciona ao painel.
 */
export default function ConteudoPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);
  return <AdmLoading />;
}

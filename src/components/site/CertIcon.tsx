/** Ícone de certificado (roseta/medalha) — usado nos botões das linhas de resultado. */
export function CertIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="9" r="6" />
      <path d="M9 14.5 7.5 22l4.5-2.6L16.5 22 15 14.5" />
      <path d="M12 6.2l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2L8.8 8.5l2.2-.3z" />
    </svg>
  );
}

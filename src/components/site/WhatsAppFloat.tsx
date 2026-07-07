import type { ContactLinks } from "@/lib/content/types";

/**
 * Floating WhatsApp button (bottom-right). Opens a chat with the registered
 * number. Toggled in ADM > Links & inscrição (Redes sociais).
 */
export default function WhatsAppFloat({ contact }: { contact: ContactLinks }) {
  const num = (contact.whatsapp || "").replace(/\D/g, "");
  if (!contact.whatsappFloat || !num) return null;

  return (
    <a
      href={`https://wa.me/${num}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5"
      style={{ background: "#25D366" }}
    >
      <svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden="true">
        <path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.7 1.4 5.8 1.4h.01C24.6 28.8 30 23.4 30 16.8 30 9.9 24.6 3 16 3zm0 23.3c-1.8 0-3.5-.5-5-1.4l-.4-.2-4.9 1 1-4.7-.2-.4c-1-1.6-1.5-3.4-1.5-5.3C5 9.6 9.9 5 16 5c5.9 0 10.8 4.9 10.8 10.8 0 6-4.9 10.5-10.8 10.5zm5.9-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.3-.2-.3 0-.5.1-.7.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z" />
      </svg>
    </a>
  );
}

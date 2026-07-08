import "server-only";
import { getEnvVar } from "./cf";

interface SendArgs {
  to: string;
  subject: string;
  text: string;
}

/**
 * Send a plain-text notification via Resend (https://resend.com), if configured.
 *
 * Requires two Worker secrets/vars:
 *   - `RESEND_API_KEY` — the Resend API key.
 *   - `NOTIFY_FROM`    — a verified sender, e.g. "Run4 <avisos@run4brasilafrica.com.br>".
 *
 * No-ops (returns false) when the key or destination is missing, so the site
 * keeps working without e-mail configured. Never throws.
 */
export async function sendNotification({ to, subject, text }: SendArgs): Promise<boolean> {
  const apiKey = getEnvVar("RESEND_API_KEY");
  if (!apiKey || !to) return false;
  const from = getEnvVar("NOTIFY_FROM") || "Run4BrasilAfrica <avisos@run4brasilafrica.com.br>";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

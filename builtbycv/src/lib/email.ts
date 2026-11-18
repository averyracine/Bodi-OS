import "server-only";

type Mail = { to: string; subject: string; text: string; html?: string; replyTo?: string };

/** Sends via Resend's HTTP API. Without RESEND_API_KEY it logs instead (dev). */
export async function sendEmail(mail: Mail): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:dev] to=${mail.to} subject=${mail.subject}\n${mail.text}`);
    return { ok: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "CV Remodeling <onboarding@resend.dev>",
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        reply_to: mail.replyTo,
      }),
    });
    if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

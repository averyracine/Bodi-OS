/**
 * Validation for user-supplied custom links.
 *
 * Custom links are only ever opened by the user's own browser as a top-level
 * navigation. The server never fetches them, so there is no SSRF surface, but we
 * still refuse anything that is not a plain public HTTPS URL.
 */

export type UrlValidation =
  | { ok: true; url: string }
  | { ok: false; reason: string };

const MAX_URL_LENGTH = 2048;

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) {
    return true;
  }
  // IPv6 literals: loopback, link-local, unique-local, unspecified
  if (h.includes(":")) {
    return h === "::1" || h === "::" || /^f[cd]/.test(h) || /^fe[89ab]/.test(h) || h.startsWith("::ffff:");
  }
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  return false;
}

export function validateCustomUrl(input: string): UrlValidation {
  const raw = (input ?? "").trim();
  if (!raw) return { ok: false, reason: "Enter a link." };
  if (raw.length > MAX_URL_LENGTH) return { ok: false, reason: "That link is too long." };
  // Reject control characters and whitespace that browsers may strip silently.
  if (/[\u0000-\u001f\u007f\s]/.test(raw)) {
    return { ok: false, reason: "Links can't contain spaces or control characters." };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: "Enter a full link starting with https://" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "Only https:// links are allowed." };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "Links can't include a username or password." };
  }
  if (!parsed.hostname.includes(".") || isPrivateHost(parsed.hostname)) {
    return { ok: false, reason: "Use a public website address." };
  }
  if (parsed.port && parsed.port !== "443") {
    return { ok: false, reason: "Custom ports aren't allowed." };
  }
  return { ok: true, url: parsed.toString() };
}

/** Same-origin relative path check for post-login redirects (prevents open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/app"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}

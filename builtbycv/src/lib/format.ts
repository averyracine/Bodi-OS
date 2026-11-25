export function formatMoney(dollars: number | null | undefined) {
  if (dollars == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(dollars);
}

export const centsToDollars = (c: number | null | undefined) => (c == null ? null : Math.round(c / 100));

/** Normalize a US phone to +1XXXXXXXXXX when possible (ready for future texting). */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits || null;
}

export function displayPhone(p: string | null | undefined) {
  if (!p) return "";
  const d = p.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

export function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? full, last: parts.slice(1).join(" ") || null };
}

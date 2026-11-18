export const BUSINESS_TZ = "America/Phoenix"; // Arizona: no daylight saving

/** Today's date (YYYY-MM-DD) in Phoenix. */
export function todayInPhoenix(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

/** Next business day (Mon–Fri) after `now`, in Phoenix, as YYYY-MM-DD. Holidays not handled. */
export function nextBusinessDay(now = new Date()): string {
  const [y, m, d] = todayInPhoenix(now).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  do {
    dt.setUTCDate(dt.getUTCDate() + 1);
  } while (dt.getUTCDay() === 0 || dt.getUTCDay() === 6);
  return dt.toISOString().slice(0, 10);
}

export function startOfWeekPhoenix(now = new Date()): Date {
  // Monday 00:00 Phoenix time (UTC-7 year-round)
  const [y, m, d] = todayInPhoenix(now).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 7));
  const dow = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - dow);
  return dt;
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const dt = typeof value === "string" && value.length === 10 ? new Date(value + "T12:00:00Z") : new Date(value);
  return new Intl.DateTimeFormat("en-US", { timeZone: BUSINESS_TZ, month: "short", day: "numeric", year: "numeric" }).format(dt);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  }).format(new Date(value));
}

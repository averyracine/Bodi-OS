/**
 * Shared allowlist for product analytics. Anything not listed here is dropped
 * on both the client and the server, so raw notes, URLs of custom links, emails
 * and pairing codes can never reach analytics.
 */

export const ANALYTICS_EVENTS = [
  "demo_open",
  "favorite_added",
  "checkout_started",
  "subscription_activated",
  "first_dashboard_use",
] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

const PROP_KEYS = ["preset", "service_id", "surface"] as const;
type PropKey = (typeof PROP_KEYS)[number];
export type AnalyticsProps = Partial<Record<PropKey, string>>;

const TOKEN_RE = /^[a-zA-Z0-9._-]{1,64}$/;

export function sanitizeUtm(input: unknown): Utm {
  const out: Utm = {};
  if (typeof input !== "object" || input === null) return out;
  for (const k of UTM_KEYS) {
    const v = (input as Record<string, unknown>)[k];
    if (typeof v === "string" && TOKEN_RE.test(v)) out[k] = v.toLowerCase();
  }
  return out;
}

export function sanitizeProps(input: unknown): AnalyticsProps {
  const out: AnalyticsProps = {};
  if (typeof input !== "object" || input === null) return out;
  for (const k of PROP_KEYS) {
    const v = (input as Record<string, unknown>)[k];
    // Custom links are reported only as a category, never by name or URL.
    if (typeof v === "string" && TOKEN_RE.test(v)) out[k] = v.startsWith("custom-") ? "custom" : v;
  }
  return out;
}

export function isAnalyticsEvent(v: unknown): v is AnalyticsEvent {
  return typeof v === "string" && (ANALYTICS_EVENTS as readonly string[]).includes(v);
}

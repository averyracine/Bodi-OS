"use client";

import { isAnalyticsEvent, sanitizeProps, sanitizeUtm, UTM_KEYS, type AnalyticsEvent, type AnalyticsProps, type Utm } from "./analytics-schema";
import { PREFS_STORAGE_KEY } from "./prefs";

const UTM_COOKIE = "tcc_utm";
const ONCE_KEY = "tcc.analytics.once";

function consentGranted(): boolean {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    return raw ? JSON.parse(raw)?.analyticsConsent === "granted" : false;
  } catch {
    return false;
  }
}

/**
 * First-touch UTM capture. Stored in a first-party cookie (30 days) so the
 * server can attach it to signup and checkout. Contains only campaign tokens.
 */
export function captureUtmFromLocation(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) found[k] = v;
    }
    const utm = sanitizeUtm(found);
    if (Object.keys(utm).length === 0) return;
    if (document.cookie.split("; ").some((c) => c.startsWith(UTM_COOKIE + "="))) return;
    document.cookie = `${UTM_COOKIE}=${encodeURIComponent(JSON.stringify(utm))}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax; Secure`;
  } catch {
    /* ignore */
  }
}

export function readUtm(): Utm {
  try {
    const c = document.cookie.split("; ").find((x) => x.startsWith(UTM_COOKIE + "="));
    return c ? sanitizeUtm(JSON.parse(decodeURIComponent(c.slice(UTM_COOKIE.length + 1)))) : {};
  } catch {
    return {};
  }
}

/** Sends an allowlisted event only if the visitor opted in. Never throws. */
export function track(event: AnalyticsEvent, props: AnalyticsProps = {}): boolean {
  if (!isAnalyticsEvent(event) || !consentGranted()) return false;
  const body = JSON.stringify({ event, props: sanitizeProps(props), utm: readUtm() });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
    }
  } catch {
    /* analytics must never break the UI */
  }
  return true;
}

/** Tracks an event at most once per browser (e.g. first_dashboard_use). */
export function trackOnce(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
  if (!consentGranted()) return;
  try {
    const seen: string[] = JSON.parse(localStorage.getItem(ONCE_KEY) ?? "[]");
    if (seen.includes(event)) return;
    localStorage.setItem(ONCE_KEY, JSON.stringify([...seen, event]));
  } catch {
    /* ignore */
  }
  track(event, props);
}

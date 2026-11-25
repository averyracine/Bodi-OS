"use client";
import { useEffect } from "react";

const KEY = "cv_attr";
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

/**
 * Records where a visitor came from: first landing page and external referrer,
 * plus the latest UTM / click-ID parameters. Sent along with form submissions.
 */
export function AttributionTracker() {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const stored = JSON.parse(localStorage.getItem(KEY) || "null") as Record<string, string> | null;
      const next: Record<string, string> = stored ?? {};
      if (!stored) {
        next.landing_page = url.pathname + url.search;
        const ref = document.referrer;
        if (ref && new URL(ref).host !== url.host) next.referrer = ref;
        next.first_seen = new Date().toISOString();
      }
      const hasCampaign = PARAMS.some((p) => url.searchParams.get(p));
      if (hasCampaign) {
        for (const p of PARAMS) {
          const v = url.searchParams.get(p);
          if (v) next[p] = v;
          else delete next[p];
        }
        if (stored) next.landing_page = url.pathname + url.search;
      }
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked — forms still work without attribution */
    }
  }, []);
  return null;
}

export function readAttribution(): Record<string, string> {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (!a.referrer && document.referrer && new URL(document.referrer).host !== location.host) a.referrer = document.referrer;
    if (!a.landing_page) a.landing_page = location.pathname + location.search;
    delete a.first_seen;
    return a;
  } catch {
    return {};
  }
}

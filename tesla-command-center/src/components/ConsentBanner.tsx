"use client";

import { usePrefs } from "./PrefsProvider";

/**
 * Opt-in analytics. Nothing is sent until the visitor explicitly allows it.
 *
 * Sits above the dashboard dock (never over it) and below the dock's layer,
 * so the dock and its "More" menu stay usable while the banner is showing.
 */
export function ConsentBanner() {
  const { prefs, update, preview } = usePrefs();
  if (preview || !prefs || prefs.analyticsConsent !== "unset") return null;
  const set = (v: "granted" | "denied") => update((p) => ({ ...p, analyticsConsent: v }));
  return (
    <div
      role="region"
      aria-label="Analytics consent"
      className="consent-banner fixed left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-[35] card p-3 sm:p-4 shadow-2xl fade-in"
    >
      <p className="font-semibold">Help us improve with anonymous usage events?</p>
      <p className="text-muted text-sm mt-1">
        Only a handful of named events (like opening the demo). Never your notes, links, email or pairing codes. Change this anytime in Settings.
      </p>
      <div className="mt-3 flex gap-2">
        <button className="btn btn-primary btn-sm" onClick={() => set("granted")}>Allow</button>
        <button className="btn btn-sm" onClick={() => set("denied")}>No thanks</button>
      </div>
    </div>
  );
}

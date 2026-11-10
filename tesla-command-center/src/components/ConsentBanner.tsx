"use client";

import { usePrefs } from "./PrefsProvider";

/** Opt-in analytics. Nothing is sent until the visitor explicitly allows it. */
export function ConsentBanner() {
  const { prefs, update, preview } = usePrefs();
  if (preview || !prefs || prefs.analyticsConsent !== "unset") return null;
  const set = (v: "granted" | "denied") => update((p) => ({ ...p, analyticsConsent: v }));
  return (
    // Sits above the floating dock (never over it), so navigation stays usable while it's showing.
    <div
      role="region"
      aria-label="Analytics consent"
      className="fixed left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-50 card p-3 sm:p-4 shadow-2xl fade-in"
      style={{ bottom: "calc(var(--dock-h) + 34px + env(safe-area-inset-bottom, 0px))" }}
    >
      <p className="font-semibold text-[0.95rem] sm:text-base">Help us improve with anonymous usage events?</p>
      <p className="text-muted text-xs sm:text-sm mt-1">
        Only a few named events. Never your notes, links, email or pairing codes. Change this anytime in Settings.
      </p>
      <div className="mt-2.5 sm:mt-3 flex gap-2">
        <button className="btn btn-primary btn-sm" onClick={() => set("granted")}>Allow</button>
        <button className="btn btn-sm" onClick={() => set("denied")}>No thanks</button>
      </div>
    </div>
  );
}

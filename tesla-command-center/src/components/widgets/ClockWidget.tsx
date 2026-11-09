"use client";

import { useNow } from "@/hooks/useBrowser";
import { formatTime } from "../AppShell";
import { usePrefs } from "../PrefsProvider";
import type { WidgetSize } from "@/lib/widgets";

export function ClockWidget({ size }: { size: WidgetSize }) {
  const now = useNow(1000);
  const { prefs } = usePrefs();
  const fmt = prefs?.clockFormat ?? "auto";
  const dayPct = now ? ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100 : 0;
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

  if (size === "compact") {
    return (
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <p className="font-display font-semibold tabular-nums leading-none text-4xl">{now ? formatTime(now, fmt) : "--:--"}</p>
        <p className="text-muted">{now ? now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) : " "}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-display font-semibold tabular-nums leading-none text-7xl">{now ? formatTime(now, fmt) : "--:--"}</p>
      <p className="text-muted mt-2">{now ? now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : " "}</p>
      <div className="mt-4">
        <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden" role="img" aria-label={`${Math.round(dayPct)}% of the day has passed`}>
          <div className="h-full bg-accent/70 rounded-full" style={{ width: `${dayPct}%` }} />
        </div>
        <p className="text-xs text-muted mt-2">{tz.replace(/_/g, " ")}</p>
      </div>
    </div>
  );
}

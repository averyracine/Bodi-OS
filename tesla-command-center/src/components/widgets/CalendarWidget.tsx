"use client";

import { useNow } from "@/hooks/useBrowser";
import type { WidgetSize } from "@/lib/widgets";
import { Icon } from "../Icon";

/**
 * A real local month view. No calendar account is connected, so no events are
 * shown and none are invented; shortcuts open your calendar's own site.
 */
export function CalendarWidget({ size }: { size: WidgetSize }) {
  const now = useNow(60_000);
  if (!now) return <div className="skeleton h-32" />;
  const y = now.getFullYear(), m = now.getMonth(), today = now.getDate();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const weekStart = today - now.getDay();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const rows = size === "expanded" ? cells : Array.from({ length: 7 }, (_, i) => { const d = weekStart + i; return d >= 1 && d <= days ? d : null; });
  const labels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div>
      <p className="font-semibold">{now.toLocaleDateString([], { month: "long", year: "numeric" })}</p>
      <div className="grid grid-cols-7 gap-1 mt-2 text-center text-sm" role="grid" aria-label={size === "expanded" ? "This month" : "This week"}>
        {labels.map((l, i) => <span key={i} className="text-[11px] text-muted font-semibold" role="columnheader">{l}</span>)}
        {rows.map((d, i) => (
          <span key={i} role="gridcell" aria-current={d === today ? "date" : undefined}
            className={`grid place-items-center h-8 rounded-lg tabular-nums ${d === today ? "bg-accent text-accent-ink font-bold" : d ? "text-fg/90" : ""}`}>
            {d ?? ""}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted mt-3">No calendar is connected, so events aren&rsquo;t shown.</p>
      <div className="flex flex-wrap gap-2 mt-2">
        <a className="btn btn-sm" href="https://calendar.google.com/" target="_blank" rel="noopener noreferrer"><Icon name="calendar" size={16} /> Google Calendar</a>
        <a className="btn btn-sm" href="https://outlook.live.com/calendar/" target="_blank" rel="noopener noreferrer"><Icon name="calendar" size={16} /> Outlook</a>
      </div>
    </div>
  );
}

"use client";

import { DEFAULT_WIDGET_LAYOUTS, hideWidget, moveWidget, showWidget, toggleWidgetSize, WIDGETS, type WidgetId, type WidgetLayout, type WidgetSize } from "@/lib/widgets";
import { usePrefs } from "../PrefsProvider";
import { Icon } from "../Icon";
import { WidgetFrame } from "./WidgetFrame";
import { ClockWidget } from "./ClockWidget";
import { MarketsWidget } from "./MarketsWidget";
import { WeatherWidget } from "./WeatherWidget";
import { CalendarWidget } from "./CalendarWidget";
import { QuickLaunchWidget } from "./QuickLaunchWidget";
import { Scratchpad } from "./Scratchpad";
import { SourceBadge } from "../markets/SourceBadge";
import { useQuoteFeed } from "../markets/QuotesProvider";

function body(id: WidgetId, size: WidgetSize) {
  switch (id) {
    case "clock": return <ClockWidget size={size} />;
    case "markets": return <MarketsWidget size={size} />;
    case "weather": return <WeatherWidget size={size} />;
    case "calendar": return <CalendarWidget size={size} />;
    case "quicklaunch": return <QuickLaunchWidget size={size} />;
    case "notes": return <Scratchpad compact={size === "compact"} bare />;
  }
}

function MarketsBadge() {
  const feed = useQuoteFeed();
  return <SourceBadge source={feed.source} />;
}

/** Per-preset widget column. Hiding a widget never deletes its data. */
export function WidgetSidebar({ editing }: { editing: boolean }) {
  const { prefs, update } = usePrefs();
  if (!prefs) return null;
  const preset = prefs.activePreset;
  const layout = prefs.widgets[preset];
  const set = (fn: (l: WidgetLayout) => WidgetLayout) =>
    update((p) => ({ ...p, widgets: { ...p.widgets, [preset]: fn(p.widgets[preset]) } }));
  const hidden = WIDGETS.filter((w) => !layout.order.includes(w.id));

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {layout.order.length === 0 && !editing && (
        <div className="card p-5 text-sm text-muted">All widgets are hidden for this mode. Use Customize to add some back.</div>
      )}
      {layout.order.map((id, i) => {
        const meta = WIDGETS.find((w) => w.id === id)!;
        const size = layout.sizes[id] ?? "compact";
        return (
          <WidgetFrame
            key={id}
            id={id}
            title={meta.label}
            badge={id === "markets" ? <MarketsBadge /> : undefined}
            controls={{
              editing,
              first: i === 0,
              last: i === layout.order.length - 1,
              size,
              onMove: (d) => set((l) => moveWidget(l, id, d)),
              onToggleSize: () => set((l) => toggleWidgetSize(l, id)),
              onHide: () => set((l) => hideWidget(l, id)),
            }}
          >
            {body(id, size)}
          </WidgetFrame>
        );
      })}
      {editing && (
        <div className="card p-4 border-dashed" aria-label="Hidden widgets">
          <p className="eyebrow">Add widgets</p>
          {hidden.length === 0 ? (
            <p className="text-sm text-muted mt-2">Every widget is on this screen.</p>
          ) : (
            <ul className="flex flex-wrap gap-2 mt-3">
              {hidden.map((w) => (
                <li key={w.id}>
                  <button className="btn btn-sm" onClick={() => set((l) => showWidget(l, w.id))} aria-label={`Show ${w.label}`} title={w.blurb}>
                    <Icon name="plus" size={16} /> {w.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            className="btn btn-sm btn-ghost mt-3"
            onClick={() => set(() => ({ order: [...DEFAULT_WIDGET_LAYOUTS[preset].order], sizes: { ...DEFAULT_WIDGET_LAYOUTS[preset].sizes } }))}
          >
            <Icon name="reset" size={16} /> Reset this mode&rsquo;s widgets
          </button>
        </div>
      )}
    </div>
  );
}

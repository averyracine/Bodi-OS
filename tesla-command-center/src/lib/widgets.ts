import type { PresetId } from "./presets";

export type WidgetId = "clock" | "markets" | "weather" | "notes" | "calendar" | "quicklaunch";
export type WidgetSize = "compact" | "expanded";

export interface WidgetMeta {
  id: WidgetId;
  label: string;
  blurb: string;
}

export const WIDGETS: WidgetMeta[] = [
  { id: "clock", label: "Clock", blurb: "Local time and date." },
  { id: "weather", label: "Weather", blurb: "Conditions for a city you choose." },
  { id: "markets", label: "Markets", blurb: "Your watchlist with trend lines." },
  { id: "calendar", label: "Calendar", blurb: "This month at a glance, plus calendar shortcuts." },
  { id: "quicklaunch", label: "Quick Launch", blurb: "A compact row of apps you pick." },
  { id: "notes", label: "Quick Notes", blurb: "Your scratchpad. Stays on this device." },
];

export const WIDGET_IDS: WidgetId[] = WIDGETS.map((w) => w.id);

export interface WidgetLayout {
  /** Visible widgets, in order. Hidden widgets keep their data. */
  order: WidgetId[];
  sizes: Partial<Record<WidgetId, WidgetSize>>;
}

export const DEFAULT_WIDGET_LAYOUTS: Record<PresetId, WidgetLayout> = {
  watch: { order: ["clock", "quicklaunch", "markets", "notes"], sizes: { markets: "expanded" } },
  listen: { order: ["clock", "weather", "quicklaunch", "notes"], sizes: {} },
  focus: { order: ["clock", "calendar", "notes", "markets"], sizes: { notes: "expanded" } },
  drive: { order: ["weather", "clock", "calendar", "notes"], sizes: { weather: "expanded" } },
};

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function sanitizeWidgetLayout(input: unknown, fallback: WidgetLayout): WidgetLayout {
  if (!isObj(input) || !Array.isArray(input.order)) return { order: [...fallback.order], sizes: { ...fallback.sizes } };
  const order: WidgetId[] = [];
  for (const v of input.order) {
    if (typeof v === "string" && (WIDGET_IDS as string[]).includes(v) && !order.includes(v as WidgetId)) order.push(v as WidgetId);
  }
  const sizes: Partial<Record<WidgetId, WidgetSize>> = {};
  if (isObj(input.sizes)) {
    for (const [k, v] of Object.entries(input.sizes)) {
      if ((WIDGET_IDS as string[]).includes(k) && (v === "compact" || v === "expanded")) sizes[k as WidgetId] = v;
    }
  }
  return { order, sizes };
}

export function moveWidget(layout: WidgetLayout, id: WidgetId, delta: -1 | 1): WidgetLayout {
  const i = layout.order.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= layout.order.length) return layout;
  const order = [...layout.order];
  [order[i], order[j]] = [order[j], order[i]];
  return { ...layout, order };
}

export function hideWidget(layout: WidgetLayout, id: WidgetId): WidgetLayout {
  return { ...layout, order: layout.order.filter((w) => w !== id) };
}

export function showWidget(layout: WidgetLayout, id: WidgetId): WidgetLayout {
  return layout.order.includes(id) ? layout : { ...layout, order: [...layout.order, id] };
}

export function toggleWidgetSize(layout: WidgetLayout, id: WidgetId): WidgetLayout {
  const cur = layout.sizes[id] ?? "compact";
  return { ...layout, sizes: { ...layout.sizes, [id]: cur === "compact" ? "expanded" : "compact" } };
}

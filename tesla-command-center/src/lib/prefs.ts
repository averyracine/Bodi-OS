import { CATALOG_BY_ID, type LaunchBehavior } from "./catalog";
import { DEFAULT_PRESET_FAVORITES, MAX_FAVORITES, PRESET_IDS, type PresetId } from "./presets";
import { DEFAULT_WIDGET_LAYOUTS, sanitizeWidgetLayout, type WidgetLayout } from "./widgets";
import { validateCustomUrl } from "./url";
import { DEFAULT_WATCHLIST, sanitizeWatchlist } from "./markets";

export type Theme = "graphite" | "midnight" | "contrast";
export type ReducedMotion = "system" | "on" | "off";
export type Consent = "unset" | "granted" | "denied";

export interface CustomLink {
  id: string;
  name: string;
  url: string;
}

export interface RecentLaunch {
  id: string;
  at: number;
}

export interface WeatherPlace {
  name: string;
  lat: number;
  lon: number;
}

export type ClockFormat = "auto" | "12h" | "24h";

export interface Preferences {
  /** v1: original MVP. v2: adds the Drive preset, widgets, quick launch, clock and weather settings. */
  version: 2;
  theme: Theme;
  reducedMotion: ReducedMotion;
  activePreset: PresetId;
  presets: Record<PresetId, string[]>;
  customLinks: CustomLink[];
  launchOverrides: Record<string, LaunchBehavior>;
  recents: RecentLaunch[];
  focus: { layout: "single" | "split"; minutes: number };
  analyticsConsent: Consent;
  markets: { watchlist: string[]; showTicker: boolean };
  quickLaunch: string[];
  widgets: Record<PresetId, WidgetLayout>;
  clockFormat: ClockFormat;
  weather: { place: WeatherPlace | null; unit: "f" | "c" };
  updatedAt: number;
}

export const DEFAULT_QUICK_LAUNCH = ["spotify", "apple-music", "youtube-music", "chatgpt", "google-maps"];

const cloneLayouts = (): Record<PresetId, WidgetLayout> =>
  Object.fromEntries(PRESET_IDS.map((id) => [id, { order: [...DEFAULT_WIDGET_LAYOUTS[id].order], sizes: { ...DEFAULT_WIDGET_LAYOUTS[id].sizes } }])) as Record<PresetId, WidgetLayout>;

export const PREFS_STORAGE_KEY = "tcc.prefs.v1";
export const NOTES_STORAGE_KEY = "tcc.notes.v1";
export const MAX_CUSTOM_LINKS = 24;
export const MAX_RECENTS = 8;

export function defaultPreferences(): Preferences {
  return {
    version: 2,
    theme: "graphite",
    reducedMotion: "system",
    activePreset: "watch",
    presets: {
      watch: [...DEFAULT_PRESET_FAVORITES.watch],
      listen: [...DEFAULT_PRESET_FAVORITES.listen],
      focus: [...DEFAULT_PRESET_FAVORITES.focus],
      drive: [...DEFAULT_PRESET_FAVORITES.drive],
      games: [...DEFAULT_PRESET_FAVORITES.games],
    },
    customLinks: [],
    launchOverrides: {},
    recents: [],
    focus: { layout: "split", minutes: 25 },
    analyticsConsent: "unset",
    markets: { watchlist: [...DEFAULT_WATCHLIST], showTicker: true },
    quickLaunch: [...DEFAULT_QUICK_LAUNCH],
    widgets: cloneLayouts(),
    clockFormat: "auto",
    weather: { place: null, unit: "f" },
    updatedAt: 0,
  };
}

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const ID_RE = /^[a-z0-9-]{1,64}$/;

/**
 * Turns untrusted JSON (localStorage, an import file, or the server) into a
 * well-formed Preferences object. Unknown fields are dropped; invalid custom
 * links are discarded rather than trusted.
 */
export function sanitizePreferences(input: unknown): Preferences {
  const d = defaultPreferences();
  if (!isObj(input)) return d;

  const customLinks: CustomLink[] = [];
  if (Array.isArray(input.customLinks)) {
    for (const l of input.customLinks.slice(0, MAX_CUSTOM_LINKS)) {
      if (!isObj(l) || typeof l.id !== "string" || !l.id.startsWith("custom-") || !ID_RE.test(l.id)) continue;
      const name = typeof l.name === "string" ? l.name.trim().slice(0, 40) : "";
      const v = typeof l.url === "string" ? validateCustomUrl(l.url) : { ok: false as const };
      if (!name || !v.ok) continue;
      if (customLinks.some((c) => c.id === l.id)) continue;
      customLinks.push({ id: l.id, name, url: v.url });
    }
  }
  const knownIds = new Set<string>([...CATALOG_BY_ID.keys(), ...customLinks.map((c) => c.id)]);

  const cleanList = (v: unknown, fallback: string[]): string[] => {
    if (!Array.isArray(v)) return fallback;
    const out: string[] = [];
    for (const id of v) {
      // Keep unknown-but-well-formed ids so the UI can show a "no longer available" state.
      if (typeof id === "string" && ID_RE.test(id) && !out.includes(id)) out.push(id);
      if (out.length >= MAX_FAVORITES) break;
    }
    return out;
  };

  const presetsIn = isObj(input.presets) ? input.presets : {};
  // v1 data has no "drive" list; cleanList falls back to the default for it.
  const presets = Object.fromEntries(PRESET_IDS.map((id) => [id, cleanList(presetsIn[id], d.presets[id])])) as Record<PresetId, string[]>;
  const widgetsIn = isObj(input.widgets) ? input.widgets : {};
  const widgets = Object.fromEntries(
    PRESET_IDS.map((id) => [id, sanitizeWidgetLayout(widgetsIn[id], d.widgets[id])]),
  ) as Record<PresetId, WidgetLayout>;
  const weatherIn = isObj(input.weather) ? input.weather : {};
  const placeIn = isObj(weatherIn.place) ? weatherIn.place : null;
  const place =
    placeIn && typeof placeIn.name === "string" && placeIn.name.trim() &&
    typeof placeIn.lat === "number" && Math.abs(placeIn.lat) <= 90 &&
    typeof placeIn.lon === "number" && Math.abs(placeIn.lon) <= 180
      ? { name: placeIn.name.trim().slice(0, 80), lat: +placeIn.lat.toFixed(3), lon: +placeIn.lon.toFixed(3) }
      : null;

  const launchOverrides: Record<string, LaunchBehavior> = {};
  if (isObj(input.launchOverrides)) {
    for (const [k, v] of Object.entries(input.launchOverrides)) {
      if (knownIds.has(k) && (v === "new-tab" || v === "same-tab")) launchOverrides[k] = v;
    }
  }

  const recents: RecentLaunch[] = [];
  if (Array.isArray(input.recents)) {
    for (const r of input.recents) {
      if (isObj(r) && typeof r.id === "string" && ID_RE.test(r.id) && typeof r.at === "number" && Number.isFinite(r.at)) {
        if (!recents.some((x) => x.id === r.id)) recents.push({ id: r.id, at: r.at });
      }
      if (recents.length >= MAX_RECENTS) break;
    }
  }

  const focusIn = isObj(input.focus) ? input.focus : {};
  const minutes = typeof focusIn.minutes === "number" ? Math.round(focusIn.minutes) : d.focus.minutes;

  return {
    version: 2,
    theme: oneOf(input.theme, ["graphite", "midnight", "contrast"] as const, d.theme),
    reducedMotion: oneOf(input.reducedMotion, ["system", "on", "off"] as const, d.reducedMotion),
    activePreset: oneOf(input.activePreset, PRESET_IDS, d.activePreset),
    presets,
    customLinks,
    launchOverrides,
    recents,
    focus: {
      layout: oneOf(focusIn.layout, ["single", "split"] as const, d.focus.layout),
      minutes: Math.min(120, Math.max(1, minutes)),
    },
    analyticsConsent: oneOf(input.analyticsConsent, ["unset", "granted", "denied"] as const, d.analyticsConsent),
    markets: {
      watchlist: sanitizeWatchlist(isObj(input.markets) ? input.markets.watchlist : undefined),
      showTicker: isObj(input.markets) && typeof input.markets.showTicker === "boolean" ? input.markets.showTicker : true,
    },
    quickLaunch: cleanList(input.quickLaunch, d.quickLaunch),
    widgets,
    clockFormat: oneOf(input.clockFormat, ["auto", "12h", "24h"] as const, d.clockFormat),
    weather: { place, unit: oneOf(weatherIn.unit, ["f", "c"] as const, d.weather.unit) },
    updatedAt: typeof input.updatedAt === "number" && Number.isFinite(input.updatedAt) ? input.updatedAt : 0,
  };
}

/** Moves an item one slot. Returns a new array; out-of-range moves are no-ops. */
export function moveItem<T>(list: readonly T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return [...list];
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function moveItemTo<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length || to < 0 || to >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function newCustomId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return "custom-" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

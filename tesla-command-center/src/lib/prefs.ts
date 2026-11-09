import { CATALOG_BY_ID, type LaunchBehavior } from "./catalog";
import { DEFAULT_PRESET_FAVORITES, MAX_FAVORITES, type PresetId } from "./presets";
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

export interface Preferences {
  version: 1;
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
  updatedAt: number;
}

export const PREFS_STORAGE_KEY = "tcc.prefs.v1";
export const NOTES_STORAGE_KEY = "tcc.notes.v1";
export const MAX_CUSTOM_LINKS = 24;
export const MAX_RECENTS = 8;

export function defaultPreferences(): Preferences {
  return {
    version: 1,
    theme: "graphite",
    reducedMotion: "system",
    activePreset: "watch",
    presets: {
      watch: [...DEFAULT_PRESET_FAVORITES.watch],
      listen: [...DEFAULT_PRESET_FAVORITES.listen],
      focus: [...DEFAULT_PRESET_FAVORITES.focus],
    },
    customLinks: [],
    launchOverrides: {},
    recents: [],
    focus: { layout: "single", minutes: 25 },
    analyticsConsent: "unset",
    markets: { watchlist: [...DEFAULT_WATCHLIST], showTicker: true },
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
  const presets = {
    watch: cleanList(presetsIn.watch, d.presets.watch),
    listen: cleanList(presetsIn.listen, d.presets.listen),
    focus: cleanList(presetsIn.focus, d.presets.focus),
  };

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
    version: 1,
    theme: oneOf(input.theme, ["graphite", "midnight", "contrast"] as const, d.theme),
    reducedMotion: oneOf(input.reducedMotion, ["system", "on", "off"] as const, d.reducedMotion),
    activePreset: oneOf(input.activePreset, ["watch", "listen", "focus"] as const, d.activePreset),
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

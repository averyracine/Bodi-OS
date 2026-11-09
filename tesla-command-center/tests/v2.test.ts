import { describe, expect, it } from "vitest";
import { defaultPreferences, sanitizePreferences } from "@/lib/prefs";
import { DEFAULT_PRESET_FAVORITES } from "@/lib/presets";
import { DEFAULT_WIDGET_LAYOUTS, hideWidget, moveWidget, sanitizeWidgetLayout, showWidget, toggleWidgetSize } from "@/lib/widgets";
import { cleanPlaceQuery, describeCode, fromOpenMeteo, openMeteoHosts, parseCoord, sampleWeather } from "@/lib/weather";
import { CATALOG, CATALOG_BY_ID } from "@/lib/catalog";
import { validateCustomUrl } from "@/lib/url";

describe("preferences v2 migration", () => {
  it("keeps v1 favorites (Focus becomes Work) and adds Drive and widgets", () => {
    const v1 = { version: 1, activePreset: "focus", presets: { watch: ["netflix"], listen: ["spotify"], focus: ["notion"] } };
    const p = sanitizePreferences(v1);
    expect(p.version).toBe(2);
    expect(p.presets.focus).toEqual(["notion"]);
    expect(p.presets.watch).toEqual(["netflix"]);
    expect(p.presets.drive).toEqual(DEFAULT_PRESET_FAVORITES.drive);
    expect(p.activePreset).toBe("focus");
    expect(p.widgets.drive.order).toEqual(DEFAULT_WIDGET_LAYOUTS.drive.order);
    expect(p.quickLaunch.length).toBeGreaterThan(0);
  });

  it("accepts drive as an active preset and rejects unknown ones", () => {
    expect(sanitizePreferences({ activePreset: "drive" }).activePreset).toBe("drive");
    expect(sanitizePreferences({ activePreset: "ludicrous" }).activePreset).toBe("watch");
  });

  it("validates weather place and clock format", () => {
    expect(sanitizePreferences({ weather: { place: { name: "Austin", lat: 30.2672, lon: -97.7431 }, unit: "c" } }).weather)
      .toEqual({ place: { name: "Austin", lat: 30.267, lon: -97.743 }, unit: "c" });
    expect(sanitizePreferences({ weather: { place: { name: "X", lat: 200, lon: 0 } } }).weather.place).toBeNull();
    expect(sanitizePreferences({ clockFormat: "24h" }).clockFormat).toBe("24h");
    expect(sanitizePreferences({ clockFormat: "36h" }).clockFormat).toBe("auto");
  });

  it("round-trips a full export", () => {
    const p = defaultPreferences();
    p.widgets.watch = hideWidget(p.widgets.watch, "markets");
    expect(sanitizePreferences(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });
});

describe("widget layouts", () => {
  const base = { order: ["clock", "markets", "notes"] as const, sizes: {} };
  it("moves, hides, shows and resizes without losing others", () => {
    const l = { order: [...base.order], sizes: {} };
    expect(moveWidget(l, "notes", -1).order).toEqual(["clock", "notes", "markets"]);
    expect(moveWidget(l, "clock", -1)).toBe(l);
    expect(hideWidget(l, "markets").order).toEqual(["clock", "notes"]);
    expect(showWidget(hideWidget(l, "markets"), "markets").order).toEqual(["clock", "notes", "markets"]);
    expect(toggleWidgetSize(l, "markets").sizes.markets).toBe("expanded");
    expect(toggleWidgetSize(toggleWidgetSize(l, "markets"), "markets").sizes.markets).toBe("compact");
  });
  it("sanitizes untrusted layouts", () => {
    const fb = DEFAULT_WIDGET_LAYOUTS.watch;
    expect(sanitizeWidgetLayout({ order: ["clock", "clock", "evil", "weather"], sizes: { clock: "huge", weather: "expanded" } }, fb))
      .toEqual({ order: ["clock", "weather"], sizes: { weather: "expanded" } });
    expect(sanitizeWidgetLayout("nope", fb)).toEqual(fb);
  });
});

describe("weather", () => {
  it("validates coordinates and place queries", () => {
    expect(parseCoord("30.26721", "-97.7")).toEqual({ lat: 30.267, lon: -97.7 });
    expect(parseCoord("91", "0")).toBeNull();
    expect(parseCoord("x", "0")).toBeNull();
    expect(cleanPlaceQuery("São Paulo, BR")).toBe("São Paulo, BR");
    expect(cleanPlaceQuery("a")).toBeNull();
    expect(cleanPlaceQuery("http://evil/?q=1")).toBeNull();
  });
  it("uses commercial hosts only with a key", () => {
    expect(openMeteoHosts().forecast).toBe("https://api.open-meteo.com/v1/forecast");
    expect(openMeteoHosts("k").forecast).toBe("https://customer-api.open-meteo.com/v1/forecast");
  });
  it("maps an Open-Meteo response", () => {
    const w = fromOpenMeteo({
      current: { temperature_2m: 71.4, weather_code: 3, wind_speed_10m: 5, is_day: 1 },
      daily: { time: ["2026-11-09", "2026-11-10"], temperature_2m_max: [75, 70], temperature_2m_min: [60, 58], weather_code: [3, 61] },
    }, "f");
    expect(w).toMatchObject({ temp: 71.4, code: 3, isDay: true, days: [{ date: "2026-11-09", max: 75, min: 60, code: 3 }, { date: "2026-11-10", max: 70, min: 58, code: 61 }] });
    expect(fromOpenMeteo({}, "f")).toBeNull();
    expect(describeCode(61).label).toBe("Rain");
    expect(sampleWeather("c").unit).toBe("c");
  });
});

describe("catalog", () => {
  it("has unique ids and only official https destinations", () => {
    expect(new Set(CATALOG.map((c) => c.id)).size).toBe(CATALOG.length);
    for (const c of CATALOG) expect(validateCustomUrl(c.url).ok).toBe(true);
  });
  it("every default preset app exists in the catalog", () => {
    for (const ids of Object.values(DEFAULT_PRESET_FAVORITES)) for (const id of ids) expect(CATALOG_BY_ID.has(id)).toBe(true);
  });
});

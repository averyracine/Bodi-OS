/**
 * Weather via Open-Meteo (https://open-meteo.com). Data is CC BY 4.0, so the
 * widget always shows attribution. Calls go through our server routes, only to
 * fixed Open-Meteo hosts, with validated numeric coordinates or a short place
 * name. The browser never sends vehicle location. Device location is used only
 * if the user taps "Use my location" and the browser grants it.
 */

export interface WeatherNow {
  temp: number;
  code: number;
  wind: number;
  isDay: boolean;
  unit: "f" | "c";
  days: { date: string; max: number; min: number; code: number }[];
  at: number;
}

export interface Place { name: string; lat: number; lon: number }

export function parseCoord(lat: unknown, lon: unknown): { lat: number; lon: number } | null {
  const a = typeof lat === "string" ? Number(lat) : lat;
  const b = typeof lon === "string" ? Number(lon) : lon;
  if (typeof a !== "number" || typeof b !== "number" || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (Math.abs(a) > 90 || Math.abs(b) > 180) return null;
  return { lat: +a.toFixed(3), lon: +b.toFixed(3) };
}

export function cleanPlaceQuery(q: unknown): string | null {
  if (typeof q !== "string") return null;
  const s = q.trim();
  if (s.length < 2 || s.length > 60) return null;
  return /^[\p{L}\p{N} ,.'-]+$/u.test(s) ? s : null;
}

/** Hosts depend on whether a commercial key is configured. Free tier is non-commercial only. */
export function openMeteoHosts(apiKey?: string) {
  return apiKey
    ? { forecast: "https://customer-api.open-meteo.com/v1/forecast", geocode: "https://customer-geocoding-api.open-meteo.com/v1/search" }
    : { forecast: "https://api.open-meteo.com/v1/forecast", geocode: "https://geocoding-api.open-meteo.com/v1/search" };
}

export function fromOpenMeteo(raw: unknown, unit: "f" | "c"): WeatherNow | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as { current?: Record<string, unknown>; daily?: Record<string, unknown[]> };
  const c = r.current;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  if (!c || num(c.temperature_2m) === null || num(c.weather_code) === null) return null;
  const d = r.daily ?? {};
  const times = Array.isArray(d.time) ? d.time : [];
  const days = times.slice(0, 5).flatMap((t, i) => {
    const max = num(d.temperature_2m_max?.[i]), min = num(d.temperature_2m_min?.[i]), code = num(d.weather_code?.[i]);
    return typeof t === "string" && max !== null && min !== null && code !== null ? [{ date: t, max, min, code }] : [];
  });
  return {
    temp: num(c.temperature_2m)!,
    code: num(c.weather_code)!,
    wind: num(c.wind_speed_10m) ?? 0,
    isDay: c.is_day !== 0,
    unit,
    days,
    at: Date.now(),
  };
}

/** WMO weather interpretation codes, as documented by Open-Meteo. */
export function describeCode(code: number): { label: string; icon: "sun" | "cloud-sun" | "cloud" | "fog" | "rain" | "snow" | "storm" } {
  if (code === 0) return { label: "Clear", icon: "sun" };
  if (code <= 2) return { label: code === 1 ? "Mostly clear" : "Partly cloudy", icon: "cloud-sun" };
  if (code === 3) return { label: "Overcast", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Fog", icon: "fog" };
  if (code >= 51 && code <= 67) return { label: code >= 61 ? "Rain" : "Drizzle", icon: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", icon: "snow" };
  if (code >= 80 && code <= 82) return { label: "Showers", icon: "rain" };
  if (code === 85 || code === 86) return { label: "Snow showers", icon: "snow" };
  if (code >= 95) return { label: "Thunderstorm", icon: "storm" };
  return { label: "Unknown", icon: "cloud" };
}

/** Labelled sample shown only when the weather service isn't available in this build. */
export function sampleWeather(unit: "f" | "c"): WeatherNow {
  const t = (f: number) => (unit === "f" ? f : Math.round(((f - 32) * 5) / 9));
  const today = new Date();
  const day = (n: number) => new Date(today.getTime() + n * 86400000).toISOString().slice(0, 10);
  return {
    temp: t(68), code: 2, wind: 8, isDay: true, unit, at: Date.now(),
    days: [
      { date: day(0), max: t(72), min: t(58), code: 2 },
      { date: day(1), max: t(75), min: t(60), code: 0 },
      { date: day(2), max: t(69), min: t(57), code: 61 },
      { date: day(3), max: t(66), min: t(55), code: 3 },
    ],
  };
}

import { connection } from "next/server";
import { fromOpenMeteo, openMeteoHosts, parseCoord, type WeatherNow } from "@/lib/weather";
import { clientKey, json } from "@/lib/request";

const TTL_MS = 10 * 60_000;
const cache = new Map<string, { at: number; data: WeatherNow }>();
const hits = new Map<string, number[]>();

/** Free Open-Meteo is non-commercial. Production requires a commercial key. */
function available(): { ok: true; key?: string } | { ok: false } {
  const key = process.env.OPEN_METEO_API_KEY;
  if (key) return { ok: true, key };
  return process.env.NODE_ENV === "production" && process.env.WEATHER_ALLOW_FREE_TIER !== "1" ? { ok: false } : { ok: true };
}

export async function GET(req: Request) {
  await connection();
  const a = available();
  if (!a.ok) return json({ error: "not_configured", message: "Weather isn't configured in this environment." }, 503);

  const params = new URL(req.url).searchParams;
  if (params.get("probe") === "1") return json({ available: true });

  const now = Date.now();
  const ck = await clientKey();
  const recent = (hits.get(ck) ?? []).filter((t) => t > now - 60_000);
  recent.push(now);
  hits.set(ck, recent);
  if (recent.length > 30) return json({ error: "rate_limited" }, 429);

  const coord = parseCoord(params.get("lat"), params.get("lon"));
  const unit = params.get("unit") === "c" ? "c" : "f";
  if (!coord) return json({ error: "bad_location" }, 400);

  const key = `${coord.lat},${coord.lon},${unit}`;
  const hit = cache.get(key);
  if (hit && now - hit.at < TTL_MS) return json({ weather: hit.data, attribution: "Weather data by Open-Meteo.com" });

  const url = new URL(openMeteoHosts(a.key).forecast);
  url.searchParams.set("latitude", String(coord.lat));
  url.searchParams.set("longitude", String(coord.lon));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m,is_day");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("temperature_unit", unit === "f" ? "fahrenheit" : "celsius");
  url.searchParams.set("wind_speed_unit", unit === "f" ? "mph" : "kmh");
  if (a.key) url.searchParams.set("apikey", a.key);

  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    const data = res.ok ? fromOpenMeteo(await res.json(), unit) : null;
    if (!data) return json({ error: "upstream_error" }, 502);
    cache.set(key, { at: now, data });
    return json({ weather: data, attribution: "Weather data by Open-Meteo.com" });
  } catch {
    return hit ? json({ weather: hit.data, stale: true, attribution: "Weather data by Open-Meteo.com" }) : json({ error: "upstream_unreachable" }, 502);
  }
}

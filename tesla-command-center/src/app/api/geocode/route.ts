import { connection } from "next/server";
import { cleanPlaceQuery, openMeteoHosts, parseCoord, type Place } from "@/lib/weather";
import { clientKey, json } from "@/lib/request";

const hits = new Map<string, number[]>();

/** City search for the weather widget. Short text query to a fixed host only. */
export async function GET(req: Request) {
  await connection();
  const key = process.env.OPEN_METEO_API_KEY;
  if (!key && process.env.NODE_ENV === "production" && process.env.WEATHER_ALLOW_FREE_TIER !== "1") {
    return json({ error: "not_configured" }, 503);
  }
  const now = Date.now();
  const ck = await clientKey();
  const recent = (hits.get(ck) ?? []).filter((t) => t > now - 60_000);
  recent.push(now);
  hits.set(ck, recent);
  if (recent.length > 20) return json({ error: "rate_limited" }, 429);

  const q = cleanPlaceQuery(new URL(req.url).searchParams.get("q"));
  if (!q) return json({ error: "bad_query" }, 400);
  const url = new URL(openMeteoHosts(key).geocode);
  url.searchParams.set("name", q);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  if (key) url.searchParams.set("apikey", key);
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!res.ok) return json({ error: "upstream_error" }, 502);
    const j = (await res.json()) as { results?: Record<string, unknown>[] };
    const places: Place[] = (j.results ?? []).flatMap((r) => {
      const c = parseCoord(r.latitude, r.longitude);
      const parts = [r.name, r.admin1, r.country].filter((x): x is string => typeof x === "string" && x.length > 0);
      return c && parts.length ? [{ name: parts.join(", ").slice(0, 80), ...c }] : [];
    });
    return json({ places });
  } catch {
    return json({ error: "upstream_unreachable" }, 502);
  }
}

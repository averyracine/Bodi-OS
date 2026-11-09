import { connection } from "next/server";
import { fromFinnhub, MAX_WATCHLIST, normalizeSymbol, type Quote } from "@/lib/markets";
import { json, clientKey } from "@/lib/request";

/**
 * Market quotes proxy. Calls one fixed provider host with a server-held key,
 * only for validated ticker symbols, so there is no arbitrary URL fetching.
 * Responses are cached briefly to protect the provider quota.
 */
const PROVIDER = "https://finnhub.io/api/v1/quote";
const TTL_MS = 30_000;
const cache = new Map<string, { at: number; quote: Quote | null }>();
const hits = new Map<string, number[]>();

function limited(key: string, now: number): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => t > now - 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > 30;
}

export async function GET(req: Request) {
  await connection();
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return json({ error: "not_configured", message: "Live quotes aren't configured (sample data is shown instead)." }, 503);

  const now = Date.now();
  if (limited(await clientKey(), now)) return json({ error: "rate_limited" }, 429);

  const raw = new URL(req.url).searchParams.get("symbols") ?? "";
  const symbols = [...new Set(raw.split(",").map(normalizeSymbol).filter((s): s is string => s !== null))].slice(0, MAX_WATCHLIST);
  if (symbols.length === 0) return json({ error: "no_symbols" }, 400);

  const quotes = await Promise.all(
    symbols.map(async (symbol) => {
      const hit = cache.get(symbol);
      if (hit && now - hit.at < TTL_MS) return hit.quote;
      try {
        const res = await fetch(`${PROVIDER}?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        const quote = res.ok ? fromFinnhub(symbol, await res.json()) : null;
        cache.set(symbol, { at: now, quote });
        return quote;
      } catch {
        return hit?.quote ?? null;
      }
    }),
  );
  return json({ source: "live", provider: "Finnhub", quotes: quotes.filter(Boolean) });
}

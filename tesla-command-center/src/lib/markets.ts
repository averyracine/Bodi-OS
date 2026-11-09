/**
 * Market watchlist: shared types, validation and clearly labelled sample data.
 *
 * Live quotes come only from our own /api/quotes route, which calls one fixed
 * provider host server-side. Without a provider key the UI shows sample prices
 * with a visible "Sample data" label. They are never presented as real.
 */

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  prevClose: number;
  /** Unix ms of the quote (provider time for live data). */
  at: number;
}

export type QuoteSource = "live" | "sample";

export const DEFAULT_WATCHLIST = ["TSLA", "SPY", "QQQ", "AAPL", "NVDA", "MSFT", "AMZN", "GOOGL"];
export const MAX_WATCHLIST = 12;
const SYMBOL_RE = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;

export function normalizeSymbol(input: string): string | null {
  const s = (input ?? "").trim().toUpperCase().replace(/^\$/, "");
  return SYMBOL_RE.test(s) ? s : null;
}

export function sanitizeWatchlist(input: unknown, fallback = DEFAULT_WATCHLIST): string[] {
  if (!Array.isArray(input)) return [...fallback];
  const out: string[] = [];
  for (const v of input) {
    const s = typeof v === "string" ? normalizeSymbol(v) : null;
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= MAX_WATCHLIST) break;
  }
  return out;
}

/** Maps a Finnhub /quote response to our Quote shape. Returns null for unknown symbols. */
export function fromFinnhub(symbol: string, raw: unknown): Quote | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const c = num(r.c), pc = num(r.pc), t = num(r.t);
  // Finnhub returns zeros for symbols it doesn't recognise.
  if (c === null || pc === null || c === 0) return null;
  const change = num(r.d) ?? c - pc;
  const changePct = num(r.dp) ?? (pc ? (change / pc) * 100 : 0);
  return { symbol, price: c, change, changePct, prevClose: pc, at: t ? t * 1000 : Date.now() };
}

// ---------------------------------------------------------------------------
// Sample data (demo only). Deterministic starting points, then a gentle random walk.
// ---------------------------------------------------------------------------

function seeded(symbol: string): number {
  let h = 2166136261;
  for (const ch of symbol) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967295;
}

const SAMPLE_BASE: Record<string, number> = {
  TSLA: 250, SPY: 560, QQQ: 480, AAPL: 220, NVDA: 130, MSFT: 420, AMZN: 190, GOOGL: 170,
};

export function sampleQuote(symbol: string, now = Date.now()): Quote {
  const r = seeded(symbol);
  const prevClose = SAMPLE_BASE[symbol] ?? Math.round(20 + r * 300);
  const pct = (r - 0.45) * 4; // roughly -1.8% .. +2.2%
  const price = +(prevClose * (1 + pct / 100)).toFixed(2);
  return { symbol, price, prevClose, change: +(price - prevClose).toFixed(2), changePct: +pct.toFixed(2), at: now };
}

export function nudgeSample(q: Quote, now = Date.now()): Quote {
  const step = (Math.random() - 0.5) * q.prevClose * 0.0016;
  const price = +Math.max(0.01, q.price + step).toFixed(2);
  const change = +(price - q.prevClose).toFixed(2);
  return { ...q, price, change, changePct: +((change / q.prevClose) * 100).toFixed(2), at: now };
}

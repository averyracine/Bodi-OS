import { describe, expect, it } from "vitest";
import { fromFinnhub, MAX_WATCHLIST, normalizeSymbol, nudgeSample, sampleQuote, sanitizeWatchlist } from "@/lib/markets";
import { sanitizePreferences } from "@/lib/prefs";

describe("markets", () => {
  it("normalizes and validates symbols", () => {
    expect(normalizeSymbol(" tsla ")).toBe("TSLA");
    expect(normalizeSymbol("$aapl")).toBe("AAPL");
    expect(normalizeSymbol("brk.b")).toBe("BRK.B");
    for (const bad of ["", "TOOLONG", "A1", "../x", "AAPL&token=x", "https://x.com"]) expect(normalizeSymbol(bad)).toBeNull();
  });

  it("sanitizes watchlists (dedupe, cap, drop invalid)", () => {
    const many = Array.from({ length: 20 }, (_, i) => "A" + String.fromCharCode(65 + i));
    expect(sanitizeWatchlist(many)).toHaveLength(MAX_WATCHLIST);
    expect(sanitizeWatchlist(["tsla", "TSLA", "bad symbol", 4])).toEqual(["TSLA"]);
    expect(sanitizePreferences({ markets: { watchlist: ["nvda"], showTicker: false } }).markets).toEqual({ watchlist: ["NVDA"], showTicker: false });
  });

  it("maps Finnhub quotes and rejects unknown symbols", () => {
    expect(fromFinnhub("TSLA", { c: 251.2, d: 1.2, dp: 0.48, pc: 250, t: 1700000000 })).toEqual({
      symbol: "TSLA", price: 251.2, change: 1.2, changePct: 0.48, prevClose: 250, at: 1700000000000,
    });
    expect(fromFinnhub("ZZZZ", { c: 0, d: null, dp: null, pc: 0, t: 0 })).toBeNull();
    expect(fromFinnhub("X", "nope")).toBeNull();
  });

  it("sample quotes are deterministic to start and stay positive", () => {
    expect(sampleQuote("TSLA", 1).price).toBe(sampleQuote("TSLA", 2).price);
    let q = sampleQuote("NVDA");
    for (let i = 0; i < 500; i++) q = nudgeSample(q);
    expect(q.price).toBeGreaterThan(0);
  });
});

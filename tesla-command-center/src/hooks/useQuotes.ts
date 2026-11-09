"use client";

import { useEffect, useRef, useState } from "react";
import { nudgeSample, sampleQuote, type Quote, type QuoteSource } from "@/lib/markets";

export interface QuoteState {
  status: "loading" | "ready" | "error";
  source: QuoteSource;
  quotes: Quote[];
  history: Record<string, number[]>;
  updatedAt: number | null;
}

const HISTORY = 40;

function seedHistory(q: Quote): number[] {
  // Sample only: a short synthetic trail so sparklines aren't empty on first paint.
  const out: number[] = [];
  let p = q.prevClose;
  for (let i = 0; i < HISTORY; i++) {
    p += (q.price - p) * 0.12 + (Math.sin(i * 1.7 + q.prevClose) * q.prevClose) / 900;
    out.push(+p.toFixed(2));
  }
  out[out.length - 1] = q.price;
  return out;
}

/**
 * Live quotes from /api/quotes when configured (polled every 30s while visible),
 * otherwise clearly labelled sample data that drifts every few seconds.
 */
export function useQuotes(symbols: string[]): QuoteState {
  const key = symbols.join(",");
  const [state, setState] = useState<QuoteState>({ status: "loading", source: "sample", quotes: [], history: {}, updatedAt: null });
  const sourceRef = useRef<QuoteSource | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const list = key ? key.split(",") : [];

    const startSample = () => {
      sourceRef.current = "sample";
      const quotes = list.map((s) => sampleQuote(s));
      setState({ status: "ready", source: "sample", quotes, history: Object.fromEntries(quotes.map((q) => [q.symbol, seedHistory(q)])), updatedAt: Date.now() });
      timer = setInterval(() => {
        if (document.hidden) return;
        setState((prev) => {
          const quotes = prev.quotes.map((q) => nudgeSample(q));
          const history = { ...prev.history };
          for (const q of quotes) history[q.symbol] = [...(history[q.symbol] ?? []), q.price].slice(-HISTORY);
          return { ...prev, quotes, history, updatedAt: Date.now() };
        });
      }, 2500);
    };

    const loadLive = async (first: boolean) => {
      try {
        const r = await fetch(`/api/quotes?symbols=${encodeURIComponent(key)}`, { cache: "no-store" });
        if (r.status === 503) {
          if (first && alive) startSample();
          return;
        }
        if (!r.ok) throw new Error(String(r.status));
        const j = (await r.json()) as { quotes: Quote[] };
        if (!alive) return;
        sourceRef.current = "live";
        setState((prev) => {
          const history = { ...prev.history };
          for (const q of j.quotes) history[q.symbol] = [...(history[q.symbol] ?? []), q.price].slice(-HISTORY);
          return { status: "ready", source: "live", quotes: j.quotes, history, updatedAt: Date.now() };
        });
      } catch {
        if (alive) setState((prev) => ({ ...prev, status: prev.quotes.length ? "ready" : "error" }));
      }
    };

    if (list.length === 0) {
      setTimeout(() => alive && setState({ status: "ready", source: "sample", quotes: [], history: {}, updatedAt: null }), 0);
      return () => {
        alive = false;
      };
    }
    void loadLive(true).then(() => {
      if (alive && sourceRef.current === "live") {
        timer = setInterval(() => !document.hidden && loadLive(false), 30_000);
      }
    });
    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [key]);

  return state;
}

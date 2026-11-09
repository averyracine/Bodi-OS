"use client";

import { useQuoteFeed } from "./QuotesProvider";
import { fmtPct, fmtPrice } from "./format";
import { usePrefs } from "../PrefsProvider";

/** Scrolling ticker band. Pauses on hover/focus; static and swipeable when motion is reduced. */
export function TickerBar() {
  const feed = useQuoteFeed();
  const { prefs } = usePrefs();
  if (!prefs?.markets.showTicker || feed.quotes.length === 0) return null;

  const items = feed.quotes.map((q) => {
    const up = q.change >= 0;
    return (
      <span key={q.symbol} className="flex items-center gap-2 px-5 whitespace-nowrap">
        <span className="font-semibold text-fg">{q.symbol}</span>
        <span className="tabular-nums text-fg/90">{fmtPrice(q.price)}</span>
        <span className={`tabular-nums font-semibold ${up ? "text-ok" : "text-danger"}`}>
          {up ? "▲" : "▼"} {fmtPct(q.changePct)}
        </span>
      </span>
    );
  });

  return (
    <div className="relative flex items-center h-11 shrink-0 border-b border-line/60 bg-surface/50 text-sm overflow-hidden" role="region" aria-label="Market ticker">
      <span className={`shrink-0 z-10 h-full flex items-center px-4 text-xs font-bold uppercase tracking-wider ${feed.source === "live" ? "text-accent" : "text-warn"} bg-surface border-r border-line/60`}>
        {feed.source === "live" ? "Markets" : "Sample"}
      </span>
      <div className="ticker-viewport flex-1 overflow-x-auto overflow-y-hidden no-scrollbar" tabIndex={0} aria-label="Ticker symbols">
        <div className="ticker-track flex w-max">
          <div className="flex">{items}</div>
          <div className="flex" aria-hidden="true">{items}</div>
        </div>
      </div>
    </div>
  );
}

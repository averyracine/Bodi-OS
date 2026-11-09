"use client";

import { useQuoteFeed } from "./QuotesProvider";
import { fmtPct, fmtPrice } from "./format";
import { usePrefs } from "../PrefsProvider";

/**
 * Slim, static ticker. Items wrap onto a hidden second line, so a symbol is
 * either fully shown or not shown: nothing is clipped and nothing animates.
 */
export function TickerBar() {
  const feed = useQuoteFeed();
  const { prefs } = usePrefs();
  if (!prefs?.markets.showTicker || prefs.markets.watchlist.length === 0) return null;
  const sample = feed.source === "sample";

  return (
    <div className="flex items-center gap-3 h-[34px] min-w-0 px-4 lg:px-6 border-b border-line text-[13px]" role="region" aria-label="Market ticker">
      <span className={`shrink-0 eyebrow !text-[10px] ${sample ? "!text-warn" : "!text-accent"}`} title={sample ? "Simulated prices. Live quotes aren't connected." : "Live quotes, may be delayed."}>
        {sample ? "Sample prices" : "Markets"}
      </span>
      {feed.status === "loading" ? (
        <span className="text-muted">Loading quotes…</span>
      ) : feed.status === "error" && feed.quotes.length === 0 ? (
        <span className="text-muted">Quotes unavailable right now.</span>
      ) : (
        <ul className="ticker-row flex-1 min-w-0" aria-label="Quotes">
          {feed.quotes.map((q) => {
            const up = q.change >= 0;
            return (
              <li key={q.symbol} className="flex items-center gap-1.5 pr-6 whitespace-nowrap" data-ticker-item>
                <span className="font-semibold">{q.symbol}</span>
                <span className="tabular-nums text-muted">{fmtPrice(q.price)}</span>
                <span className={`tabular-nums font-semibold ${up ? "text-ok" : "text-danger"}`}>
                  <span aria-hidden="true">{up ? "▲" : "▼"}</span> {fmtPct(q.changePct)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

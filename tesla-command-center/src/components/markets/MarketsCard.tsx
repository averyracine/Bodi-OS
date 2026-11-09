"use client";

import { useQuoteFeed } from "./QuotesProvider";
import { Sparkline } from "./Sparkline";
import { SourceBadge } from "./SourceBadge";
import { fmtPct, fmtPrice } from "./format";
import { ViewLink } from "../Nav";

export function MarketsCard({ limit = 5 }: { limit?: number }) {
  const feed = useQuoteFeed();
  const shown = feed.quotes.slice(0, limit);
  return (
    <section className="card p-5" aria-labelledby="markets-h">
      <div className="flex items-center gap-2">
        <h2 id="markets-h" className="font-semibold text-lg mr-auto">Markets</h2>
        <SourceBadge source={feed.source} />
      </div>
      {feed.status === "loading" ? (
        <div className="flex flex-col gap-2 mt-3">{Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-11" />)}</div>
      ) : feed.status === "error" ? (
        <p role="alert" className="text-warn mt-3">Couldn&rsquo;t load quotes. They&rsquo;ll retry automatically.</p>
      ) : shown.length === 0 ? (
        <p className="text-muted mt-3">Your watchlist is empty. <ViewLink view="settings" hash="markets" className="text-accent underline">Add symbols</ViewLink></p>
      ) : (
        <ul className="mt-2 flex flex-col">
          {shown.map((q) => {
            const up = q.change >= 0;
            return (
              <li key={q.symbol} className="grid grid-cols-[minmax(0,1fr)_96px_auto] items-center gap-3 min-h-[52px] border-b border-line/50 last:border-0">
                <span className="min-w-0">
                  <span className="block font-semibold">{q.symbol}</span>
                  <span className="block text-sm text-muted tabular-nums">{fmtPrice(q.price)}</span>
                </span>
                <Sparkline values={feed.history[q.symbol] ?? []} up={up} />
                <span className={`tabular-nums text-sm font-semibold rounded-lg px-2 py-1 min-w-[76px] text-right ${up ? "text-ok bg-ok/10" : "text-danger bg-danger/10"}`}>
                  {fmtPct(q.changePct)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-muted mt-3">For information only, not investment advice.</p>
    </section>
  );
}

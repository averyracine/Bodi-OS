"use client";

import type { WidgetSize } from "@/lib/widgets";
import { useQuoteFeed } from "../markets/QuotesProvider";
import { Sparkline } from "../markets/Sparkline";
import { fmtPct, fmtPrice } from "../markets/format";
import { ViewLink } from "../Nav";

export function MarketsWidget({ size }: { size: WidgetSize }) {
  const feed = useQuoteFeed();
  const shown = feed.quotes.slice(0, size === "expanded" ? 6 : 3);
  if (feed.status === "loading") return <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-11" />)}</div>;
  if (feed.status === "error" && feed.quotes.length === 0) return <p role="alert" className="text-warn text-sm">Couldn&rsquo;t load quotes. Retrying automatically.</p>;
  if (shown.length === 0)
    return <p className="text-muted text-sm">Your watchlist is empty. <ViewLink view="settings" hash="markets" className="text-accent underline">Add symbols</ViewLink></p>;
  return (
    <>
      <ul className="flex flex-col">
        {shown.map((q) => {
          const up = q.change >= 0;
          return (
            <li key={q.symbol} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 min-h-[48px] border-b border-line last:border-0">
              <span className="min-w-0">
                <span className="block font-semibold leading-tight">{q.symbol}</span>
                <span className="block text-xs text-muted tabular-nums">{fmtPrice(q.price)}</span>
              </span>
              {size === "expanded" ? <Sparkline values={feed.history[q.symbol] ?? []} up={up} width={88} height={28} /> : <span />}
              <span className={`tabular-nums text-sm font-semibold rounded-lg px-2 py-1 min-w-[72px] text-right ${up ? "text-ok bg-ok/10" : "text-danger bg-danger/10"}`}>
                {fmtPct(q.changePct)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-muted mt-2">
        {feed.source === "sample" ? "Sample data · not real prices. " : "Live quotes via Finnhub, may be delayed. "}Not investment advice.
      </p>
    </>
  );
}

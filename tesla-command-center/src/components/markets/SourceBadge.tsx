import type { QuoteSource } from "@/lib/markets";

export function SourceBadge({ source }: { source: QuoteSource }) {
  return source === "live" ? (
    <span className="chip" title="Quotes from Finnhub via our server. May be delayed.">Live · may be delayed</span>
  ) : (
    <span className="chip chip-warn" title="Live quotes aren't connected in this build. Prices are simulated.">Sample data · not real prices</span>
  );
}

"use client";

import { useState } from "react";
import { MAX_WATCHLIST, normalizeSymbol } from "@/lib/markets";
import { usePrefs } from "../PrefsProvider";
import { Icon } from "../Icon";

export function WatchlistEditor() {
  const { prefs, update } = usePrefs();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  if (!prefs) return null;
  const list = prefs.markets.watchlist;
  const setMarkets = (m: Partial<typeof prefs.markets>) => update((p) => ({ ...p, markets: { ...p.markets, ...m } }));

  return (
    <div className="flex flex-col gap-4">
      <div className="seg self-start" role="radiogroup" aria-label="Ticker band">
        {[true, false].map((v) => (
          <button key={String(v)} role="radio" aria-checked={prefs.markets.showTicker === v} onClick={() => setMarkets({ showTicker: v })}>
            {v ? "Show ticker" : "Hide ticker"}
          </button>
        ))}
      </div>
      <ul className="flex flex-wrap gap-2" aria-label="Watchlist">
        {list.map((s, i) => (
          <li key={s} className="flex items-center gap-1 rounded-xl border border-line bg-surface-2 pl-3">
            <span className="font-semibold tabular-nums">{s}</span>
            <button className="btn btn-sm btn-ghost !min-w-[44px]" aria-label={`Move ${s} earlier`} disabled={i === 0}
              onClick={() => setMarkets({ watchlist: list.map((x, j) => (j === i - 1 ? s : j === i ? list[i - 1] : x)) })}>
              <Icon name="left" size={16} />
            </button>
            <button className="btn btn-sm btn-ghost !min-w-[44px]" aria-label={`Remove ${s}`} onClick={() => setMarkets({ watchlist: list.filter((x) => x !== s) })}>
              <Icon name="x" size={16} />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const s = normalizeSymbol(text);
          if (!s) return setError("Enter a ticker symbol like TSLA or BRK.B.");
          if (list.includes(s)) return setError(`${s} is already on your list.`);
          if (list.length >= MAX_WATCHLIST) return setError(`You can follow up to ${MAX_WATCHLIST} symbols.`);
          setMarkets({ watchlist: [...list, s] });
          setText("");
          setError("");
        }}
      >
        <label className="flex-1">
          <span className="sr-only">Add a symbol</span>
          <input className="input uppercase" value={text} maxLength={8} autoCapitalize="characters" autoComplete="off" spellCheck={false}
            onChange={(e) => setText(e.target.value)} placeholder="Add a symbol, e.g. RIVN" aria-invalid={Boolean(error)} />
        </label>
        <button className="btn"><Icon name="plus" size={20} /> Add</button>
      </form>
      {error && <p role="alert" className="text-danger text-sm">{error}</p>}
    </div>
  );
}

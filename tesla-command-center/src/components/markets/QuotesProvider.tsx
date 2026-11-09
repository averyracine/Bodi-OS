"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuotes, type QuoteState } from "@/hooks/useQuotes";
import { usePrefs } from "../PrefsProvider";

const Ctx = createContext<QuoteState | null>(null);

/** One quote feed shared by the ticker band and the markets card. */
export function QuotesProvider({ children }: { children: ReactNode }) {
  const { prefs } = usePrefs();
  const state = useQuotes(prefs?.markets.watchlist ?? []);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useQuoteFeed(): QuoteState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useQuoteFeed must be used inside QuotesProvider");
  return v;
}

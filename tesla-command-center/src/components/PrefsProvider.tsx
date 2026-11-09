"use client";

import { createContext, useCallback, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPrefsStore, type PrefsStore } from "@/lib/prefs-store";
import type { Preferences } from "@/lib/prefs";

interface PrefsContextValue {
  store: PrefsStore;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children, persistent = true }: { children: ReactNode; persistent?: boolean }) {
  const [store] = useState(() => createPrefsStore(persistent));
  return <PrefsContext.Provider value={{ store }}>{children}</PrefsContext.Provider>;
}

/** Returns null until preferences have loaded on the client. */
export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  const { store } = ctx;
  const prefs = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const update = useCallback(
    (fn: (p: Preferences) => Preferences) => {
      const cur = store.getSnapshot();
      if (cur) store.set(fn(cur));
    },
    [store],
  );
  return { prefs, update, store, preview: !store.persistent };
}

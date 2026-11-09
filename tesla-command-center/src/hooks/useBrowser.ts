"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { notesStore } from "@/lib/notes-store";

const onlineSub = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export function useOnline(): boolean {
  return useSyncExternalStore(onlineSub, () => navigator.onLine, () => true);
}

/** Returns null during SSR so the clock never causes a hydration mismatch. */
export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

export function useNotes() {
  return useSyncExternalStore(notesStore.subscribe, notesStore.getSnapshot, notesStore.getServerSnapshot);
}

const noopSub = () => () => {};
export function useMounted(): boolean {
  return useSyncExternalStore(noopSub, () => true, () => false);
}

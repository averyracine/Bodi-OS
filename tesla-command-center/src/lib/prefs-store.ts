"use client";

import { defaultPreferences, PREFS_STORAGE_KEY, sanitizePreferences, type Preferences } from "./prefs";

export interface PrefsStore {
  subscribe(cb: () => void): () => void;
  getSnapshot(): Preferences | null;
  getServerSnapshot(): Preferences | null;
  set(next: Preferences): void;
  reset(): void;
  persistent: boolean;
  /** Last storage error, e.g. quota exceeded or storage blocked. */
  error: string | null;
}

/**
 * Small external store around localStorage so React can read preferences
 * without hydration mismatches. A non-persistent store powers the landing
 * page preview so visitors can play without changing their real settings.
 */
export function createPrefsStore(persistent: boolean, initial?: Preferences): PrefsStore {
  const listeners = new Set<() => void>();
  let cache: Preferences | null = initial ?? null;
  const emit = () => listeners.forEach((l) => l());

  const load = (): Preferences => {
    if (!persistent) return defaultPreferences();
    try {
      const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
      return raw ? sanitizePreferences(JSON.parse(raw)) : defaultPreferences();
    } catch {
      store.error = "Browser storage is unavailable. Changes will last only until this page closes.";
      return defaultPreferences();
    }
  };

  const onStorage = (e: StorageEvent) => {
    if (e.key === PREFS_STORAGE_KEY) {
      cache = load();
      emit();
    }
  };

  const store: PrefsStore = {
    persistent,
    error: null,
    subscribe(cb) {
      listeners.add(cb);
      if (persistent && listeners.size === 1) window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        if (persistent && listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot() {
      if (typeof window === "undefined") return null;
      cache ??= load();
      return cache;
    },
    getServerSnapshot() {
      return null;
    },
    set(next) {
      cache = { ...next, updatedAt: Date.now() };
      if (persistent) {
        try {
          window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(cache));
          store.error = null;
        } catch {
          store.error = "Couldn't save to this browser. Storage may be full or disabled.";
        }
      }
      emit();
    },
    reset() {
      if (persistent) {
        try {
          window.localStorage.removeItem(PREFS_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
      cache = defaultPreferences();
      emit();
    },
  };
  return store;
}

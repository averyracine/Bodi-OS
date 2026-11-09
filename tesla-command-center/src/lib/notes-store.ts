"use client";

import { NOTES_STORAGE_KEY } from "./prefs";

/** Device-local notes. Never synced to the server and never sent to analytics. */
export interface ChecklistItem { id: string; text: string; done: boolean }
export interface Notes { scratch: string; checklist: ChecklistItem[] }

const EMPTY: Notes = { scratch: "", checklist: [] };
const listeners = new Set<() => void>();
let cache: Notes | null = null;

function load(): Notes {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return EMPTY;
    const v = JSON.parse(raw);
    return {
      scratch: typeof v?.scratch === "string" ? v.scratch.slice(0, 20000) : "",
      checklist: Array.isArray(v?.checklist)
        ? v.checklist
            .filter((i: unknown): i is ChecklistItem => typeof (i as ChecklistItem)?.id === "string" && typeof (i as ChecklistItem)?.text === "string")
            .slice(0, 50)
            .map((i: ChecklistItem) => ({ id: i.id, text: i.text.slice(0, 200), done: Boolean(i.done) }))
        : [],
    };
  } catch {
    return EMPTY;
  }
}

export const notesStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot(): Notes {
    cache ??= load();
    return cache;
  },
  getServerSnapshot(): Notes | null {
    return null;
  },
  set(next: Notes) {
    cache = next;
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* in-memory only */
    }
    listeners.forEach((l) => l());
  },
  clear() {
    try {
      localStorage.removeItem(NOTES_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    cache = EMPTY;
    listeners.forEach((l) => l());
  },
};

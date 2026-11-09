"use client";

import { useId } from "react";
import { notesStore } from "@/lib/notes-store";
import { useNotes } from "@/hooks/useBrowser";
import { usePrefs } from "../PrefsProvider";

/** Native scratchpad. Stored only in this browser; never synced or sent to analytics. */
export function Scratchpad({ compact = false, bare = false }: { compact?: boolean; bare?: boolean }) {
  const notes = useNotes();
  const { preview } = usePrefs();
  const id = useId();
  return (
    <div className={bare ? "flex flex-col" : "card p-5 flex flex-col"}>
      <label htmlFor={id} className={bare ? "sr-only" : "font-semibold text-lg"}>Scratchpad</label>
      <p className="text-muted text-sm">{preview ? "Preview only. Notes here aren't saved." : "Saved only in this browser. Never synced or sent to analytics."}</p>
      <textarea
        id={id}
        className={`input mt-3 resize-none ${compact ? "h-32" : "flex-1 min-h-[280px]"}`}
        placeholder="Parking spot, charger number, a quick thought…"
        maxLength={20000}
        defaultValue={preview ? "" : notes?.scratch ?? ""}
        key={notes === null ? "loading" : "ready"}
        disabled={notes === null}
        onChange={(e) => {
          if (!preview && notes) notesStore.set({ ...notesStore.getSnapshot(), scratch: e.target.value });
        }}
      />
    </div>
  );
}

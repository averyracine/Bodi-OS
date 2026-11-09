"use client";

import { useState } from "react";
import { notesStore } from "@/lib/notes-store";
import { useNotes } from "@/hooks/useBrowser";
import { usePrefs } from "../PrefsProvider";
import { Icon } from "../Icon";

export function Checklist() {
  const notes = useNotes();
  const { preview } = usePrefs();
  const [text, setText] = useState("");
  const [local, setLocal] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const items = preview ? local : notes?.checklist ?? [];
  const save = (next: typeof items) => (preview ? setLocal(next) : notesStore.set({ ...notesStore.getSnapshot(), checklist: next }));

  return (
    <div className="card p-5 flex flex-col gap-3">
      <h2 className="font-semibold text-lg">Checklist</h2>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim().slice(0, 200);
          if (!t || items.length >= 50) return;
          save([...items, { id: crypto.randomUUID(), text: t, done: false }]);
          setText("");
        }}
      >
        <label className="flex-1">
          <span className="sr-only">New checklist item</span>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a task" maxLength={200} />
        </label>
        <button className="btn" aria-label="Add task"><Icon name="plus" size={20} /></button>
      </form>
      {items.length === 0 ? (
        <p className="text-muted">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-2">
              <label className="flex items-center gap-3 flex-1 min-h-[56px] px-2 rounded-xl hover:bg-surface-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-6 h-6 accent-[var(--accent)]"
                  checked={it.done}
                  onChange={() => save(items.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)))}
                />
                <span className={it.done ? "line-through text-muted" : ""}>{it.text}</span>
              </label>
              <button className="btn btn-sm btn-ghost" aria-label={`Delete ${it.text}`} onClick={() => save(items.filter((x) => x.id !== it.id))}>
                <Icon name="x" size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useNow } from "@/hooks/useBrowser";
import { usePrefs } from "../PrefsProvider";
import { Icon } from "../Icon";

type TimerState = { kind: "idle" } | { kind: "running"; endsAt: number } | { kind: "paused"; remainingMs: number } | { kind: "done" };
const KEY = "tcc.timer.v1";
const CHOICES = [15, 25, 50];

function loadState(): TimerState {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    if (v?.kind === "running" && typeof v.endsAt === "number") return v;
    if (v?.kind === "paused" && typeof v.remainingMs === "number") return v;
  } catch {
    /* ignore */
  }
  return { kind: "idle" };
}

/**
 * Wall-clock based timer: it stays correct if the browser suspends the tab,
 * because remaining time is derived from an absolute end time.
 */
export function Timer() {
  const { prefs, update } = usePrefs();
  const [state, setState] = useState<TimerState>(() => (typeof window === "undefined" ? { kind: "idle" } : loadState()));
  const now = useNow(500);
  const minutes = prefs?.focus.minutes ?? 25;

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const t = now?.getTime() ?? 0;
  const finished = state.kind === "running" && now !== null && state.endsAt <= t;
  const remaining =
    state.kind === "running" ? Math.max(0, state.endsAt - t) : state.kind === "paused" ? state.remainingMs : state.kind === "done" ? 0 : minutes * 60_000;
  const shown = finished ? 0 : remaining;
  const mm = Math.floor(shown / 60_000);
  const ss = Math.floor((shown % 60_000) / 1000);
  const total = minutes * 60_000;
  const pct = Math.min(1, Math.max(0, 1 - shown / total));
  const running = state.kind === "running" && !finished;
  const isDone = finished || state.kind === "done";

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Focus timer</h2>
        <div className="seg" role="radiogroup" aria-label="Timer length">
          {CHOICES.map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={minutes === m}
              disabled={running}
              onClick={() => {
                update((p) => ({ ...p, focus: { ...p.focus, minutes: m } }));
                setState({ kind: "idle" });
              }}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>
      <div className="relative grid place-items-center py-4">
        <svg viewBox="0 0 120 120" className="w-56 h-56 -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--surface-3)" strokeWidth="8" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${pct * 339.3} 339.3`} />
        </svg>
        <p className="absolute text-5xl font-semibold tabular-nums" role="timer" aria-live="off">
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </p>
      </div>
      {isDone && <p role="status" className="text-center text-accent font-semibold">Time&rsquo;s up. Nice work.</p>}
      <div className="flex gap-3 justify-center">
        {running ? (
          <button className="btn btn-primary min-w-[140px]" onClick={() => state.kind === "running" && setState({ kind: "paused", remainingMs: Math.max(0, state.endsAt - Date.now()) })}>
            <Icon name="pause" size={20} /> Pause
          </button>
        ) : (
          <button
            className="btn btn-primary min-w-[140px]"
            onClick={() => setState({ kind: "running", endsAt: Date.now() + (state.kind === "paused" ? state.remainingMs : total) })}
          >
            <Icon name="play" size={20} /> {state.kind === "paused" ? "Resume" : isDone ? "Restart" : "Start"}
          </button>
        )}
        <button className="btn" onClick={() => setState({ kind: "idle" })} disabled={state.kind === "idle"}>
          <Icon name="reset" size={20} /> Reset
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { usePrefs } from "../PrefsProvider";
import { Timer } from "../widgets/Timer";
import { Scratchpad } from "../widgets/Scratchpad";
import { Checklist } from "../widgets/Checklist";
import { ViewLink } from "../Nav";

type Widget = "timer" | "notes" | "checklist";
const LABEL: Record<Widget, string> = { timer: "Timer", notes: "Scratchpad", checklist: "Checklist" };

function render(w: Widget) {
  return w === "timer" ? <Timer /> : w === "notes" ? <Scratchpad /> : <Checklist />;
}

export function FocusView() {
  const { prefs, update } = usePrefs();
  const [single, setSingle] = useState<Widget>("timer");
  const [left, setLeft] = useState<Widget>("timer");
  const [right, setRight] = useState<Widget>("notes");
  if (!prefs) return <div className="skeleton h-96" aria-busy="true" aria-label="Loading focus workspace" />;
  const layout = prefs.focus.layout;

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold tracking-tight">Focus workspace</h1>
          <p className="text-muted">For parked work sessions. Everything here is built in and stays on this device.</p>
        </div>
        <div className="seg" role="radiogroup" aria-label="Layout">
          {(["single", "split"] as const).map((l) => (
            <button key={l} role="radio" aria-checked={layout === l} onClick={() => update((p) => ({ ...p, focus: { ...p.focus, layout: l } }))}>
              {l === "single" ? "Single" : "Split (prototype)"}
            </button>
          ))}
        </div>
      </div>

      {layout === "single" ? (
        <>
          <div role="tablist" aria-label="Widget" className="flex gap-2">
            {(Object.keys(LABEL) as Widget[]).map((w) => (
              <button key={w} role="tab" aria-selected={single === w} className={`btn btn-sm ${single === w ? "btn-primary" : ""}`} onClick={() => setSingle(w)}>
                {LABEL[w]}
              </button>
            ))}
          </div>
          <div className="max-w-3xl w-full">{render(single)}</div>
        </>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {([[left, setLeft, "Left pane"], [right, setRight, "Right pane"]] as const).map(([w, set, label]) => (
            <section key={label} aria-label={label} className="flex flex-col gap-3 min-w-0">
              <label className="flex items-center gap-2 text-sm text-muted">
                {label}
                <select className="input !min-h-[48px] !w-auto" value={w} onChange={(e) => set(e.target.value as Widget)}>
                  {(Object.keys(LABEL) as Widget[]).map((x) => <option key={x} value={x}>{LABEL[x]}</option>)}
                </select>
              </label>
              {render(w)}
            </section>
          ))}
        </div>
      )}

      <div className="card p-4 text-sm text-muted">
        <p>
          <strong className="text-fg">Why only built-in widgets?</strong> Most websites block being shown inside another page, and we
          won&rsquo;t strip those protections. So the split view only uses our own widgets. To use another service, open it from the{" "}
          <ViewLink view="library" className="text-accent underline">library</ViewLink>; it opens as its own page.
        </p>
      </div>
    </div>
  );
}

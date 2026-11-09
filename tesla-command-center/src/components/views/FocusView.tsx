"use client";

import { useState } from "react";
import { usePrefs } from "../PrefsProvider";
import { Timer } from "../widgets/Timer";
import { Scratchpad } from "../widgets/Scratchpad";
import { Checklist } from "../widgets/Checklist";
import { ViewLink } from "../Nav";
import { AppCard, recordLaunch, resolveService, type ResolvedService } from "../ServiceTile";
import { Icon } from "../Icon";

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
  const workApps = prefs.presets.focus.map((id) => resolveService(id, prefs)).filter((x): x is ResolvedService => x !== null).slice(0, 4);

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <p className="eyebrow">Built-in tools · stays on this device</p>
          <h1 className="font-display text-3xl font-semibold mt-1">Focus</h1>
        </div>
        <div className="seg" role="radiogroup" aria-label="Layout">
          {(["single", "split"] as const).map((l) => (
            <button key={l} role="radio" aria-checked={layout === l} onClick={() => update((p) => ({ ...p, focus: { ...p.focus, layout: l } }))}>
              {l === "single" ? "Single" : "Split view"}
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
        <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {([[left, setLeft, "Left pane"], [right, setRight, "Right pane"]] as const).map(([w, set, label]) => (
            <section key={label} aria-label={label} className="flex flex-col gap-3 min-w-0">
              <label className="flex items-center gap-2 text-sm text-muted">
                {label}
                <select className="input !min-h-[44px] !w-auto !py-0" value={w} onChange={(e) => set(e.target.value as Widget)}>
                  {(Object.keys(LABEL) as Widget[]).map((x) => <option key={x} value={x}>{LABEL[x]}</option>)}
                </select>
              </label>
              {render(w)}
            </section>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="work-apps-h">
        <div className="flex items-center gap-3">
          <h2 id="work-apps-h" className="eyebrow mr-auto">Work apps</h2>
          <ViewLink view="library" className="btn btn-sm btn-ghost !min-h-[40px]"><Icon name="edit" size={16} /> Edit in Library</ViewLink>
        </div>
        {workApps.length === 0 ? (
          <p className="text-sm text-muted">Add apps to your Work mode in the Library.</p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {workApps.map((svc) => (
              <li key={svc.id}><AppCard svc={svc} compact onLaunch={() => update((p) => recordLaunch(p, svc.id))} /></li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted">
          These open as their own pages. Most websites block being shown inside another page, and we won&rsquo;t strip those protections, so
          the split view only uses our built-in tools.
        </p>
      </section>
    </div>
  );
}

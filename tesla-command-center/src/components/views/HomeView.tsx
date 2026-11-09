"use client";

import { useEffect, useState } from "react";
import { PRESETS, MAX_FAVORITES, type PresetId } from "@/lib/presets";
import { moveItem, moveItemTo } from "@/lib/prefs";
import { track, trackOnce } from "@/lib/analytics";
import { useNow } from "@/hooks/useBrowser";
import { usePrefs } from "../PrefsProvider";
import { Icon, type IconName } from "../Icon";
import { ViewLink } from "../Nav";
import { AppCard, LaunchLink, recordLaunch, resolveService, AppIcon, type ResolvedService } from "../ServiceTile";
import { WidgetSidebar } from "../widgets/WidgetSidebar";

const MODE_ICON: Record<PresetId, IconName> = { watch: "tv", listen: "headphones", focus: "briefcase", drive: "route" };

function greeting(d: Date | null) {
  if (!d) return "Welcome back";
  const h = d.getHours();
  return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function HomeView() {
  const { prefs, update, preview } = usePrefs();
  const [editing, setEditing] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");
  const now = useNow(60_000);

  if (!prefs) return <HomeSkeleton />;

  const preset = prefs.activePreset;
  const ids = prefs.presets[preset];
  const presetMeta = PRESETS.find((p) => p.id === preset)!;

  const setList = (next: string[]) => update((p) => ({ ...p, presets: { ...p.presets, [preset]: next } }));
  const move = (i: number, d: -1 | 1) => {
    setList(moveItem(ids, i, d));
    const name = resolveService(ids[i], prefs)?.name ?? "Item";
    setAnnounce(`${name} moved to position ${Math.min(Math.max(i + d, 0), ids.length - 1) + 1} of ${ids.length}.`);
  };
  const remove = (i: number) => setList(ids.filter((_, j) => j !== i));
  const choosePreset = (id: PresetId) => update((p) => ({ ...p, activePreset: id }));
  const onLaunch = (id: string) => {
    update((p) => recordLaunch(p, id));
    if (!preview) trackOnce("first_dashboard_use", { preset });
  };
  const recents = prefs.recents.map((r) => resolveService(r.id, prefs)).filter((x): x is ResolvedService => x !== null).slice(0, 6);

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="mr-auto min-w-0">
          <p className="eyebrow">{greeting(now)}</p>
          <h1 className="font-display text-[2rem] sm:text-4xl font-semibold leading-tight mt-1">Your Command Center</h1>
        </div>
        <div role="radiogroup" aria-label="Mode" className="seg !grid grid-cols-4 w-full sm:w-auto">
          {PRESETS.map((p) => (
            <button key={p.id} role="radio" aria-checked={p.id === preset} onClick={() => choosePreset(p.id)} className="flex items-center justify-center gap-2 !px-2 sm:!px-4 min-w-0">
              <Icon name={MODE_ICON[p.id]} size={18} className="hidden sm:block shrink-0" />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,34%)] items-start">
        <section aria-labelledby="fav-heading" className="min-w-0 flex flex-col gap-4">
          <div key={preset} className="mode-fade flex flex-wrap items-center gap-3">
            <div className="mr-auto min-w-0">
              <h2 id="fav-heading" className="text-lg font-semibold">{presetMeta.label} apps</h2>
              <p className="text-sm text-muted">
                {presetMeta.blurb}
                {presetMeta.parkedUse && <span className="text-muted"> For use while parked.</span>}
              </p>
            </div>
            <button className={`btn btn-sm ${editing ? "btn-primary" : ""}`} aria-pressed={editing} onClick={() => setEditing((e) => !e)}>
              <Icon name={editing ? "check" : "edit"} size={18} /> {editing ? "Done" : "Arrange"}
            </button>
          </div>

          <p className="sr-only" aria-live="polite">{announce}</p>

          {ids.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-lg font-semibold">No apps in {presetMeta.label} yet</p>
              <p className="text-muted mt-1">Add up to {MAX_FAVORITES} from the library.</p>
              <ViewLink view="library" className="btn btn-primary mt-4"><Icon name="grid" size={20} /> Browse the library</ViewLink>
            </div>
          ) : (
            <ol key={preset} className="mode-fade grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4" aria-label={`${presetMeta.label} favorites`}>
              {ids.map((id, i) => {
                const svc = resolveService(id, prefs);
                const dragProps = editing
                  ? {
                      draggable: true,
                      onDragStart: () => setDragFrom(i),
                      onDragOver: (e: React.DragEvent) => e.preventDefault(),
                      onDrop: () => {
                        if (dragFrom !== null) setList(moveItemTo(ids, dragFrom, i));
                        setDragFrom(null);
                      },
                      onDragEnd: () => setDragFrom(null),
                    }
                  : {};
                return (
                  <li key={id} {...dragProps} className={`relative ${dragFrom === i ? "opacity-50" : ""}`}>
                    {!svc ? (
                      <div className="card p-4 h-full min-h-[148px] flex flex-col gap-2">
                        <p className="font-semibold">Unavailable</p>
                        <p className="text-sm text-muted">No longer in the catalog or your links.</p>
                        <button className="btn btn-sm btn-danger mt-auto self-start" onClick={() => remove(i)}>Remove</button>
                      </div>
                    ) : editing ? (
                      <div className="card p-3 h-full min-h-[148px] flex flex-col gap-3 border-dashed cursor-grab">
                        <div className="flex items-center gap-3 min-w-0">
                          <AppIcon id={svc.id} name={svc.name} hue={svc.hue} accent={svc.accent} size={44} />
                          <span className="font-semibold leading-tight break-words min-w-0">{svc.name}</span>
                        </div>
                        <div className="mt-auto flex gap-2">
                          <button className="btn btn-sm" aria-label={`Move ${svc.name} earlier`} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="left" size={20} /></button>
                          <button className="btn btn-sm" aria-label={`Move ${svc.name} later`} disabled={i === ids.length - 1} onClick={() => move(i, 1)}><Icon name="right" size={20} /></button>
                          <button className="btn btn-sm btn-danger ml-auto" aria-label={`Remove ${svc.name} from ${presetMeta.label}`} onClick={() => remove(i)}><Icon name="x" size={20} /></button>
                        </div>
                      </div>
                    ) : (
                      <AppCard svc={svc} onLaunch={() => onLaunch(id)} />
                    )}
                  </li>
                );
              })}
              {editing && ids.length < MAX_FAVORITES && (
                <li className="list-none">
                  <ViewLink view="library" className="card border-dashed h-full min-h-[148px] flex flex-col items-center justify-center gap-2 text-muted hover:text-fg">
                    <Icon name="plus" size={24} /> Add apps
                  </ViewLink>
                </li>
              )}
            </ol>
          )}

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <h2 className="eyebrow">Recently opened</h2>
              {recents.length > 0 && (
                <button className="btn btn-sm btn-ghost ml-auto !min-h-[40px]" onClick={() => update((p) => ({ ...p, recents: [] }))}>Clear</button>
              )}
            </div>
            {recents.length === 0 ? (
              <p className="text-muted text-sm mt-2">Apps you open will show up here.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {recents.map((svc) => (
                  <li key={svc.id}>
                    <LaunchLink service={svc} onLaunch={() => onLaunch(svc.id)} className="flex items-center gap-2 min-h-[56px] pl-2 pr-4 rounded-2xl border border-line bg-surface-2/60 hover:bg-surface-3">
                      <AppIcon id={svc.id} name={svc.name} hue={svc.hue} accent={svc.accent} size={36} />
                      <span className="font-medium">{svc.name}</span>
                    </LaunchLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-muted text-xs">
            Apps open each service&rsquo;s own website. None have been tested in a Tesla browser yet, and their accounts and subscriptions are separate from ours.
          </p>
        </section>

        <aside className="flex flex-col gap-3 min-w-0" aria-label="Widgets">
          <div className="flex items-center justify-end">
            <button className={`btn btn-sm ${customizing ? "btn-primary" : "btn-ghost"}`} aria-pressed={customizing} onClick={() => setCustomizing((c) => !c)}>
              <Icon name={customizing ? "check" : "layout"} size={18} /> {customizing ? "Done" : "Customize widgets"}
            </button>
          </div>
          <WidgetSidebar editing={customizing} />
        </aside>
      </div>
      {!preview && <TrackDemoOpen />}
    </div>
  );
}

function TrackDemoOpen() {
  // Fires once per session; consent is checked inside track().
  useEffect(() => {
    try {
      if (sessionStorage.getItem("tcc.demo_open")) return;
      if (track("demo_open", { surface: "app" })) sessionStorage.setItem("tcc.demo_open", "1");
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}

export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading dashboard">
      <div className="skeleton h-16 w-80 max-w-full" />
      <div className="grid gap-5 lg:grid-cols-[1fr_34%]">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton h-[148px]" />)}
        </div>
        <div className="flex flex-col gap-4">
          <div className="skeleton h-36" />
          <div className="skeleton h-56" />
        </div>
      </div>
    </div>
  );
}

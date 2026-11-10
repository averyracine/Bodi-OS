"use client";

import { useEffect, useState } from "react";
import { PRESETS, MAX_FAVORITES } from "@/lib/presets";
import { CATALOG, CATEGORY_LABELS } from "@/lib/catalog";
import { moveItem, moveItemTo } from "@/lib/prefs";
import { track, trackOnce } from "@/lib/analytics";
import { useNow } from "@/hooks/useBrowser";
import { usePrefs } from "../PrefsProvider";
import { Icon } from "../Icon";
import { ModeSelector, MODE_ICON } from "../ModeSelector";
import { ViewLink } from "../Nav";
import { AppTile, BrandArt, recordLaunch, resolveService, type ResolvedService } from "../ServiceTile";
import { WidgetSidebar } from "../widgets/WidgetSidebar";


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
  const onLaunch = (id: string) => {
    update((p) => recordLaunch(p, id));
    if (!preview) trackOnce("first_dashboard_use", { preset });
  };
  const recents = prefs.recents.map((r) => resolveService(r.id, prefs)).filter((x): x is ResolvedService => x !== null).slice(0, 6);

  return (
    <div className="flex flex-col gap-5 fade-in">
      <ModeSelector className="lg:hidden w-full sm:w-auto sm:self-start" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,34%)] items-start">
        <section aria-labelledby="fav-heading" className="min-w-0 flex flex-col gap-4">
          <div key={`head-${preset}`} className="mode-fade flex items-start gap-3">
            <div className="mr-auto min-w-0 flex-1">
              <p className="eyebrow">{greeting(now)} · {presetMeta.label} mode</p>
              <h1 id="fav-heading" className="font-display text-3xl sm:text-[2.1rem] font-semibold leading-tight mt-1 flex items-center gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-accent-soft text-accent shrink-0" aria-hidden="true">
                  <Icon name={MODE_ICON[preset]} size={22} />
                </span>
                {presetMeta.label}
              </h1>
              <p className="text-sm text-muted mt-2">
                <span className="hidden sm:inline">{presetMeta.blurb} </span>Tiles open each service&rsquo;s own website{ids.some((id) => prefs.launchOverrides[id] === "same-tab") ? " (tiles marked “Opens here” use this tab)" : " in a new tab"}.
              </p>
            </div>
            <button className={`btn btn-sm shrink-0 mt-6 ${editing ? "btn-primary" : ""}`} aria-pressed={editing} onClick={() => setEditing((e) => !e)}>
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
            <ol key={`grid-${preset}`} className="mode-fade grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5" aria-label={`${presetMeta.label} favorites`}>
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
                      <div className="card p-4 h-full flex flex-col gap-2 aspect-[4/3]">
                        <p className="font-semibold">Unavailable</p>
                        <p className="text-sm text-muted">No longer in the catalog or your links.</p>
                        <button className="btn btn-sm btn-danger mt-auto self-start" onClick={() => remove(i)}>Remove</button>
                      </div>
                    ) : editing ? (
                      <div className="flex flex-col gap-2 cursor-grab" aria-label={`${svc.name}, position ${i + 1}`}>
                        <span className="relative block">
                          <BrandArt id={svc.id} name={svc.name} accent={svc.accent} className="opacity-90 outline-2 outline-dashed outline-offset-2 outline-line-strong" />
                          <Icon name="drag" size={18} className="absolute top-2 left-2 text-white/80 drop-shadow" />
                        </span>
                        <span className="app-tile-label">{svc.name}</span>
                        <div className="flex gap-1.5 justify-center">
                          <button className="btn btn-sm !px-2" aria-label={`Move ${svc.name} earlier`} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="left" size={20} /></button>
                          <button className="btn btn-sm !px-2" aria-label={`Move ${svc.name} later`} disabled={i === ids.length - 1} onClick={() => move(i, 1)}><Icon name="right" size={20} /></button>
                          <button className="btn btn-sm btn-danger !px-2" aria-label={`Remove ${svc.name} from ${presetMeta.label}`} onClick={() => remove(i)}><Icon name="x" size={20} /></button>
                        </div>
                      </div>
                    ) : (
                      <AppTile svc={svc} onLaunch={() => onLaunch(id)} />
                    )}
                  </li>
                );
              })}
              {editing && ids.length < MAX_FAVORITES && (
                <li className="list-none">
                  <ViewLink view="library" className="card border-dashed w-full aspect-[4/3] flex flex-col items-center justify-center gap-2 text-muted hover:text-fg">
                    <Icon name="plus" size={24} /> Add apps
                  </ViewLink>
                </li>
              )}
            </ol>
          )}

          {preset !== "drive" && (
            <GamesRow
              apps={GAME_IDS.map((id) => resolveService(id, prefs)).filter((x): x is ResolvedService => x !== null)}
              onLaunch={onLaunch}
            />
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
              <ul className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-3" aria-label="Recently opened apps">
                {recents.map((svc) => (
                  <li key={svc.id}>
                    <AppTile svc={svc} compact onLaunch={() => onLaunch(svc.id)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-muted text-xs">
            For use while parked. None of these apps have been tested in a Tesla browser yet; their accounts and subscriptions are separate, and logos belong to their owners.
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

/** Catalog games, featured first. Not part of the editable mode favorites. */
const GAME_IDS = CATALOG.filter((s) => s.category === "games")
  .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
  .map((s) => s.id);

/** A fixed Games row on Home (hidden in Drive mode). Each tile only links out to the official service. */
function GamesRow({ apps, onLaunch }: { apps: ResolvedService[]; onLaunch: (id: string) => void }) {
  if (apps.length === 0) return null;
  return (
    <section aria-labelledby="games-heading" className="card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 id="games-heading" className="eyebrow flex items-center gap-2">
          <Icon name="gamepad" size={16} /> {CATEGORY_LABELS.games}
        </h2>
        <span className="text-xs text-muted ml-auto">Parked use · bring a controller</span>
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-4 sm:gap-x-4" aria-label="Games">
        {apps.map((svc) => (
          <li key={svc.id}>
            <AppTile svc={svc} onLaunch={() => onLaunch(svc.id)} />
          </li>
        ))}
      </ul>
    </section>
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

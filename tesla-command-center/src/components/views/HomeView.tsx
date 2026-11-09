"use client";

import { useEffect, useState } from "react";
import { PRESETS, MAX_FAVORITES, type PresetId } from "@/lib/presets";
import { moveItem, moveItemTo } from "@/lib/prefs";
import { track, trackOnce } from "@/lib/analytics";
import { useNow } from "@/hooks/useBrowser";
import { usePrefs } from "../PrefsProvider";
import { Icon } from "../Icon";
import { ViewLink } from "../Nav";
import { LaunchLink, Monogram, recordLaunch, resolveService, ServiceMeta } from "../ServiceTile";
import { Scratchpad } from "../widgets/Scratchpad";

export function HomeView() {
  const { prefs, update, preview } = usePrefs();
  const [editing, setEditing] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");
  const now = useNow(15_000);

  if (!prefs) return <HomeSkeleton />;

  const preset = prefs.activePreset;
  const ids = prefs.presets[preset];
  const presetMeta = PRESETS.find((p) => p.id === preset)!;

  const setList = (next: string[]) => update((p) => ({ ...p, presets: { ...p.presets, [preset]: next } }));
  const move = (i: number, d: -1 | 1) => {
    const next = moveItem(ids, i, d);
    setList(next);
    const name = resolveService(ids[i], prefs)?.name ?? "Item";
    setAnnounce(`${name} moved to position ${Math.min(Math.max(i + d, 0), ids.length - 1) + 1} of ${ids.length}.`);
  };
  const remove = (i: number) => setList(ids.filter((_, j) => j !== i));
  const choosePreset = (id: PresetId) => update((p) => ({ ...p, activePreset: id }));
  const onLaunch = (id: string) => {
    update((p) => recordLaunch(p, id));
    if (!preview) trackOnce("first_dashboard_use", { preset });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] fade-in">
      <section aria-labelledby="fav-heading" className="min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1 id="fav-heading" className="text-2xl font-semibold tracking-tight mr-auto">
            {presetMeta.label} favorites
          </h1>
          <div role="radiogroup" aria-label="Preset" className="seg">
            {PRESETS.map((p) => (
              <button key={p.id} role="radio" aria-checked={p.id === preset} onClick={() => choosePreset(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
          <button className={`btn btn-sm ${editing ? "btn-primary" : ""}`} aria-pressed={editing} onClick={() => setEditing((e) => !e)}>
            <Icon name={editing ? "check" : "edit"} size={18} /> {editing ? "Done" : "Arrange"}
          </button>
        </div>

        {presetMeta.parkedUse && (
          <p className="mb-4 flex items-start gap-2 rounded-2xl border border-line bg-surface/60 px-4 py-3 text-sm text-muted">
            <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-warn" />
            <span>
              {presetMeta.label} is meant for when you&rsquo;re parked. This page can&rsquo;t see your car&rsquo;s gear or speed, so it can&rsquo;t check for you.
            </span>
          </p>
        )}

        <p className="sr-only" aria-live="polite">{announce}</p>

        {ids.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-lg font-semibold">No favorites in {presetMeta.label} yet</p>
            <p className="text-muted mt-1">Add up to {MAX_FAVORITES} from the library.</p>
            <ViewLink view="library" className="btn btn-primary mt-4">
              <Icon name="grid" size={20} /> Browse the library
            </ViewLink>
          </div>
        ) : (
          <ol className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4" aria-label={`${presetMeta.label} favorites`}>
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
                <li key={id} {...dragProps} className={`card relative min-h-[168px] ${dragFrom === i ? "opacity-50" : ""}`}>
                  {!svc ? (
                    <div className="p-5 h-full flex flex-col gap-2">
                      <p className="font-semibold">Unavailable</p>
                      <p className="text-sm text-muted">This item is no longer in the catalog or your links.</p>
                      <button className="btn btn-sm btn-danger mt-auto self-start" onClick={() => remove(i)}>
                        Remove
                      </button>
                    </div>
                  ) : editing ? (
                    <div className="p-4 h-full flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <Icon name="drag" size={20} className="text-muted cursor-grab" />
                        <Monogram name={svc.name} hue={svc.hue} size={44} />
                        <span className="font-semibold text-lg leading-tight break-words min-w-0">{svc.name}</span>
                      </div>
                      <div className="mt-auto flex gap-2">
                        <button className="btn btn-sm" aria-label={`Move ${svc.name} earlier`} disabled={i === 0} onClick={() => move(i, -1)}>
                          <Icon name="left" size={20} />
                        </button>
                        <button className="btn btn-sm" aria-label={`Move ${svc.name} later`} disabled={i === ids.length - 1} onClick={() => move(i, 1)}>
                          <Icon name="right" size={20} />
                        </button>
                        <button className="btn btn-sm btn-danger ml-auto" aria-label={`Remove ${svc.name} from ${presetMeta.label}`} onClick={() => remove(i)}>
                          <Icon name="x" size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <LaunchLink
                      service={svc}
                      onLaunch={() => onLaunch(id)}
                      className="group flex flex-col gap-3 p-5 h-full min-h-[168px] rounded-[var(--radius)] hover:bg-surface-3/50 transition-colors"
                    >
                      <Monogram name={svc.name} hue={svc.hue} size={60} />
                      <span className="mt-auto">
                        <span className="block text-xl font-semibold leading-tight break-words">{svc.name}</span>
                        <ServiceMeta service={svc} />
                      </span>
                    </LaunchLink>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <p className="text-muted text-sm mt-4">
          Each tile opens the service&rsquo;s own website. None have been tested in a Tesla browser yet, and their accounts and subscriptions are separate from ours.
        </p>
      </section>

      <aside className="flex flex-col gap-5 min-w-0" aria-label="Today">
        <div className="card p-5">
          <p className="text-muted text-sm font-medium">{now ? now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : " "}</p>
          <p className="text-6xl font-semibold tabular-nums tracking-tight mt-1">
            {now ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--:--"}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Recent</h2>
            {prefs.recents.length > 0 && (
              <button className="btn btn-sm btn-ghost" onClick={() => update((p) => ({ ...p, recents: [] }))}>
                Clear
              </button>
            )}
          </div>
          {prefs.recents.length === 0 ? (
            <p className="text-muted mt-2">Apps you open will show up here.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1">
              {prefs.recents.slice(0, 5).map((r) => {
                const svc = resolveService(r.id, prefs);
                if (!svc) return null;
                return (
                  <li key={r.id}>
                    <LaunchLink service={svc} onLaunch={() => onLaunch(r.id)} className="flex items-center gap-3 min-h-[56px] px-2 rounded-xl hover:bg-surface-3">
                      <Monogram name={svc.name} hue={svc.hue} size={36} />
                      <span className="font-medium">{svc.name}</span>
                      <span className="ml-auto text-muted text-sm">{new Date(r.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                    </LaunchLink>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Scratchpad compact />

        <div className="flex gap-3">
          <ViewLink view="library" className="btn flex-1"><Icon name="plus" size={20} /> Add apps</ViewLink>
          <ViewLink view="settings" className="btn flex-1"><Icon name="settings" size={20} /> Settings</ViewLink>
        </div>
        {!preview && <TrackDemoOpen />}
      </aside>
    </div>
  );
}

function TrackDemoOpen() {
  // Fires once per mount; consent is checked inside track().
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
    <div className="grid gap-5 xl:grid-cols-[2fr_1fr]" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-[168px]" />)}
      </div>
      <div className="flex flex-col gap-5">
        <div className="skeleton h-36" />
        <div className="skeleton h-48" />
      </div>
    </div>
  );
}

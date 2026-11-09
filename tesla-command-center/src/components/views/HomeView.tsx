"use client";

import { useEffect, useState } from "react";
import { PRESETS, MAX_FAVORITES, type PresetId } from "@/lib/presets";
import { moveItem, moveItemTo } from "@/lib/prefs";
import { BRAND_ART } from "@/lib/brand-icons";
import { track, trackOnce } from "@/lib/analytics";
import { useNow } from "@/hooks/useBrowser";
import { usePrefs } from "../PrefsProvider";
import { Icon } from "../Icon";
import { ViewLink } from "../Nav";
import { LaunchLink, Monogram, isLight, recordLaunch, resolveService, ServiceArt, type ResolvedService } from "../ServiceTile";
import { Scratchpad } from "../widgets/Scratchpad";
import { MarketsCard } from "../markets/MarketsCard";

function greeting(d: Date | null) {
  if (!d) return "Welcome back";
  const h = d.getHours();
  return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** Full-bleed tile in the service's own colours, sized to read from the driver's seat. */
function FavoriteTile({ svc }: { svc: ResolvedService }) {
  const art = BRAND_ART[svc.id];
  const bg = art?.bg;
  const textColor = bg ? (isLight(bg) ? "#111418" : "#ffffff") : undefined;
  return (
    <span
      className="relative flex flex-col justify-between h-full min-h-[156px] p-4 rounded-[var(--radius)] overflow-hidden transition-transform group-hover:-translate-y-0.5"
      style={
        bg
          ? { background: `linear-gradient(155deg, ${bg} 0%, color-mix(in srgb, ${bg} 72%, #000) 100%)`, color: textColor }
          : undefined
      }
    >
      {bg && <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(255,255,255,0.16),transparent_55%)]" />}
      <span className="relative">
        {art?.path ? (
          <svg viewBox="0 0 24 24" width={52} height={52} fill={art.fg} aria-hidden="true">
            <path d={art.path} />
          </svg>
        ) : art?.wordmark ? (
          <span
            aria-hidden="true"
            className="block leading-none"
            style={{ color: art.fg, fontSize: art.wordmark.text.length > 6 ? 26 : 34, fontWeight: art.wordmark.weight ?? 800, fontStyle: art.wordmark.italic ? "italic" : undefined, letterSpacing: "-0.01em" }}
          >
            {art.wordmark.text}
          </span>
        ) : (
          <Monogram name={svc.name} hue={svc.hue} size={52} />
        )}
      </span>
      <span className="relative">
        <span className="block text-lg font-semibold leading-tight break-words">{svc.name}</span>
        <span className="flex items-center gap-1 text-xs opacity-75">
          <Icon name="external" size={12} /> {svc.launch === "new-tab" ? "Opens in new tab" : "Opens here"}
        </span>
      </span>
    </span>
  );
}

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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] fade-in">
      <section aria-labelledby="fav-heading" className="min-w-0 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="mr-auto">
            <p className="text-muted text-sm font-medium">{greeting(now)}</p>
            <h1 id="fav-heading" className="text-3xl font-semibold tracking-tight">{presetMeta.label}</h1>
          </div>
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
          <p className="flex items-center gap-2 text-sm text-muted">
            <Icon name="shield" size={16} className="shrink-0 text-warn" />
            For use while parked. This page can&rsquo;t see your car&rsquo;s gear or speed.
          </p>
        )}

        <p className="sr-only" aria-live="polite">{announce}</p>

        {ids.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-lg font-semibold">No favorites in {presetMeta.label} yet</p>
            <p className="text-muted mt-1">Add up to {MAX_FAVORITES} from the library.</p>
            <ViewLink view="library" className="btn btn-primary mt-4"><Icon name="grid" size={20} /> Browse the library</ViewLink>
          </div>
        ) : (
          <ol className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label={`${presetMeta.label} favorites`}>
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
                <li key={id} {...dragProps} className={`relative min-h-[156px] rounded-[var(--radius)] ${dragFrom === i ? "opacity-50" : ""}`}>
                  {!svc ? (
                    <div className="card p-4 h-full flex flex-col gap-2">
                      <p className="font-semibold">Unavailable</p>
                      <p className="text-sm text-muted">No longer in the catalog or your links.</p>
                      <button className="btn btn-sm btn-danger mt-auto self-start" onClick={() => remove(i)}>Remove</button>
                    </div>
                  ) : editing ? (
                    <div className="card p-3 h-full flex flex-col gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <ServiceArt id={svc.id} name={svc.name} hue={svc.hue} size={44} rounded={12} />
                        <span className="font-semibold leading-tight break-words min-w-0">{svc.name}</span>
                      </div>
                      <div className="mt-auto flex gap-2">
                        <button className="btn btn-sm" aria-label={`Move ${svc.name} earlier`} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="left" size={20} /></button>
                        <button className="btn btn-sm" aria-label={`Move ${svc.name} later`} disabled={i === ids.length - 1} onClick={() => move(i, 1)}><Icon name="right" size={20} /></button>
                        <button className="btn btn-sm btn-danger ml-auto" aria-label={`Remove ${svc.name} from ${presetMeta.label}`} onClick={() => remove(i)}><Icon name="x" size={20} /></button>
                      </div>
                    </div>
                  ) : (
                    <LaunchLink service={svc} onLaunch={() => onLaunch(id)} className={`group block h-full rounded-[var(--radius)] ${BRAND_ART[svc.id] ? "" : "card"}`}>
                      <FavoriteTile svc={svc} />
                    </LaunchLink>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">Recently opened</h2>
            {recents.length > 0 && (
              <button className="btn btn-sm btn-ghost ml-auto" onClick={() => update((p) => ({ ...p, recents: [] }))}>Clear</button>
            )}
          </div>
          {recents.length === 0 ? (
            <p className="text-muted text-sm mt-1">Apps you open will show up here.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {recents.map((svc) => (
                <li key={svc.id}>
                  <LaunchLink service={svc} onLaunch={() => onLaunch(svc.id)} className="flex items-center gap-2 min-h-[56px] pl-2 pr-4 rounded-2xl border border-line bg-surface-2 hover:bg-surface-3">
                    <ServiceArt id={svc.id} name={svc.name} hue={svc.hue} size={36} rounded={10} />
                    <span className="font-medium">{svc.name}</span>
                  </LaunchLink>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-muted text-xs">
          Tiles open each service&rsquo;s own website. None have been tested in a Tesla browser yet. Their accounts and subscriptions are separate, and logos belong to their owners.
        </p>
      </section>

      <aside className="flex flex-col gap-5 min-w-0" aria-label="At a glance">
        <div className="card p-5 relative overflow-hidden">
          <span aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-accent/10 blur-2xl" />
          <p className="relative text-muted text-sm font-medium">{now ? now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : " "}</p>
          <p className="relative text-6xl font-semibold tabular-nums tracking-tight mt-1">
            {now ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--:--"}
          </p>
        </div>
        <MarketsCard />
        <Scratchpad compact />
        {!preview && <TrackDemoOpen />}
      </aside>
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
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 content-start">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton h-[156px]" />)}
      </div>
      <div className="flex flex-col gap-5">
        <div className="skeleton h-36" />
        <div className="skeleton h-72" />
      </div>
    </div>
  );
}

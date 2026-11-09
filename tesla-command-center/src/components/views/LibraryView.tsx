"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import { CATALOG, CATEGORY_LABELS, domainOf, TESLA_STATUS_LABEL, type Category, type LaunchBehavior } from "@/lib/catalog";
import { MAX_CUSTOM_LINKS, newCustomId } from "@/lib/prefs";
import { MAX_FAVORITES, PRESETS, type PresetId } from "@/lib/presets";
import { validateCustomUrl } from "@/lib/url";
import { track } from "@/lib/analytics";
import { usePrefs } from "../PrefsProvider";
import { Icon } from "../Icon";
import { LaunchLink, recordLaunch, resolveService, ServiceArt } from "../ServiceTile";

type Filter = "all" | Category;
const FILTERS: Filter[] = ["all", "video", "music", "ai", "productivity", "games", "utilities", "custom"];
type Target = PresetId | "quick";

interface Row {
  id: string;
  name: string;
  category: Category;
  url: string;
  requiresAccount: boolean;
  parkedUseOnly: boolean;
  defaultLaunch: LaunchBehavior;
  custom: boolean;
  blurb: string;
}

export function LibraryView() {
  const { prefs, update, preview } = usePrefs();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [notice, setNotice] = useState("");
  const [target, setTarget] = useState<Target | null>(null);
  const deferredQuery = useDeferredValue(query);

  const rows: Row[] = useMemo(() => {
    const base: Row[] = CATALOG.map((s) => ({
      id: s.id, name: s.name, category: s.category, url: s.url, requiresAccount: s.requiresAccount,
      parkedUseOnly: s.parkedUseOnly, defaultLaunch: s.launch, custom: false, blurb: s.blurb,
    }));
    const custom: Row[] = (prefs?.customLinks ?? []).map((c) => ({
      id: c.id, name: c.name, category: "custom", url: c.url, requiresAccount: false,
      parkedUseOnly: false, defaultLaunch: "new-tab", custom: true, blurb: "Your link.",
    }));
    return [...custom, ...base];
  }, [prefs?.customLinks]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.category] = (c[r.category] ?? 0) + 1;
    return c;
  }, [rows]);

  if (!prefs) return <div className="skeleton h-96" aria-busy="true" aria-label="Loading library" />;

  const q = deferredQuery.trim().toLowerCase();
  const visible = rows.filter(
    (r) => (filter === "all" || r.category === filter) &&
      (!q || r.name.toLowerCase().includes(q) || domainOf(r.url).includes(q) || CATEGORY_LABELS[r.category].toLowerCase().includes(q)),
  );
  const tgt: Target = target ?? prefs.activePreset;
  const tgtLabel = tgt === "quick" ? "Quick Launch" : PRESETS.find((p) => p.id === tgt)!.label;
  const favs = tgt === "quick" ? prefs.quickLaunch : prefs.presets[tgt];
  const setFavs = (fn: (l: string[]) => string[]) =>
    update((p) => (tgt === "quick" ? { ...p, quickLaunch: fn(p.quickLaunch) } : { ...p, presets: { ...p.presets, [tgt]: fn(p.presets[tgt]) } }));

  const toggleFav = (row: Row) => {
    if (favs.includes(row.id)) {
      setFavs((l) => l.filter((x) => x !== row.id));
      setNotice(`Removed ${row.name} from ${tgtLabel}.`);
      return;
    }
    if (favs.length >= MAX_FAVORITES) {
      setNotice(`${tgtLabel} already has ${MAX_FAVORITES} apps. Remove one first.`);
      return;
    }
    setFavs((l) => [...l, row.id]);
    setNotice(`Added ${row.name} to ${tgtLabel}.`);
    if (!preview && tgt !== "quick") track("favorite_added", { preset: tgt, service_id: row.id });
  };

  const setLaunch = (id: string, v: LaunchBehavior) =>
    update((p) => ({ ...p, launchOverrides: { ...p.launchOverrides, [id]: v } }));

  const removeCustom = (id: string) =>
    update((p) => {
      const { [id]: _drop, ...launchOverrides } = p.launchOverrides;
      void _drop;
      return {
        ...p,
        customLinks: p.customLinks.filter((c) => c.id !== id),
        launchOverrides,
        presets: Object.fromEntries(Object.entries(p.presets).map(([k, v]) => [k, v.filter((x) => x !== id)])) as typeof p.presets,
        quickLaunch: p.quickLaunch.filter((x) => x !== id),
        recents: p.recents.filter((r) => r.id !== id),
      };
    });

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div className="flex flex-wrap items-end gap-4">
        <div className="mr-auto">
          <p className="eyebrow">{rows.length} apps</p>
          <h1 className="font-display text-3xl font-semibold mt-1">Library</h1>
        </div>
        <label className="relative w-full sm:w-[380px] block">
          <span className="sr-only">Search apps</span>
          <span className="pointer-events-none absolute inset-y-0 left-0 w-12 grid place-items-center text-muted" data-search-icon>
            <Icon name="search" size={20} />
          </span>
          <input type="search" className="input !pl-12" placeholder="Search apps or websites" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Categories" className="flex flex-wrap gap-2 mr-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm gap-2 ${filter === f ? "btn-primary" : ""}`}
            >
              {f === "all" ? "All" : CATEGORY_LABELS[f]}
              <span className={`text-xs tabular-nums ${filter === f ? "opacity-70" : "text-muted"}`}>{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 card px-4 py-3">
        <span className="text-sm text-muted">Starring adds to</span>
        <div className="seg" role="radiogroup" aria-label="Add apps to">
          {[...PRESETS.map((p) => ({ id: p.id as Target, label: p.label })), { id: "quick" as Target, label: "Quick Launch" }].map((o) => (
            <button key={o.id} role="radio" aria-checked={tgt === o.id} onClick={() => setTarget(o.id)} className="!min-h-[44px]">{o.label}</button>
          ))}
        </div>
        <span className="text-sm text-muted tabular-nums">{favs.length}/{MAX_FAVORITES}</span>
      </div>

      <p className="sr-only" aria-live="polite">{notice}</p>
      {notice && <p className="text-sm text-accent" aria-hidden="true">{notice}</p>}

      {(filter === "all" || filter === "custom") && (
        <AddCustomLink
          disabled={prefs.customLinks.length >= MAX_CUSTOM_LINKS}
          onAdd={(name, url) => update((p) => ({ ...p, customLinks: [...p.customLinks, { id: newCustomId(), name, url }] }))}
        />
      )}

      {visible.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-semibold text-lg">No matches{q ? ` for “${query}”` : ""}</p>
          <p className="text-muted mt-1">Try another search, or add it as a custom HTTPS link.</p>
          {q && <button className="btn mt-4" onClick={() => setQuery("")}>Clear search</button>}
        </div>
      ) : (
        <ul className="grid gap-3 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((row) => {
            const svc = resolveService(row.id, prefs)!;
            const launch = prefs.launchOverrides[row.id] ?? row.defaultLaunch;
            const fav = favs.includes(row.id);
            return (
              <li key={row.id} className="card p-4 flex flex-col gap-3" style={{ ["--tint" as string]: svc.accent }}>
                <div className="flex items-start gap-3">
                  <ServiceArt id={row.id} name={row.name} hue={svc.hue} accent={svc.accent} size={52} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-lg leading-tight break-words">{row.name}</p>
                    <p className="text-muted text-sm">{row.blurb}</p>
                    <p className="text-muted text-xs break-all mt-0.5">{domainOf(row.url)}</p>
                  </div>
                  <button
                    className={`btn btn-sm ${fav ? "text-accent border-accent/40" : "text-muted"}`}
                    aria-pressed={fav}
                    aria-label={fav ? `Remove ${row.name} from ${tgtLabel}` : `Add ${row.name} to ${tgtLabel}`}
                    onClick={() => toggleFav(row)}
                  >
                    <Icon name="star" size={22} className={fav ? "fill-current" : ""} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="chip">{CATEGORY_LABELS[row.category]}</span>
                  {!row.custom && <span className="chip chip-warn">{TESLA_STATUS_LABEL["not-tested"]}</span>}
                  {row.requiresAccount && <span className="chip">Needs its own account</span>}
                  {row.parkedUseOnly && <span className="chip">Parked use</span>}
                  {row.custom && <span className="chip">Your link · not tested</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-auto">
                  <div className="seg" role="radiogroup" aria-label={`How ${row.name} opens`}>
                    {(["new-tab", "same-tab"] as const).map((v) => (
                      <button key={v} role="radio" aria-checked={launch === v} onClick={() => setLaunch(row.id, v)} className="!min-h-[44px]">
                        {v === "new-tab" ? "New tab" : "This tab"}
                      </button>
                    ))}
                  </div>
                  <LaunchLink
                    service={{ ...svc, launch }}
                    onLaunch={() => update((p) => recordLaunch(p, row.id))}
                    className="btn btn-sm btn-primary"
                  >
                    Open <Icon name="external" size={16} />
                  </LaunchLink>
                  {row.custom && (
                    <button className="btn btn-sm btn-danger" onClick={() => removeCustom(row.id)} aria-label={`Delete custom link ${row.name}`}>
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-muted text-sm">
        Links open the service&rsquo;s official site as a normal page. We don&rsquo;t embed, proxy or sign in to third-party services, and a link here isn&rsquo;t a promise that playback works in your car.
      </p>
    </div>
  );
}

function AddCustomLink({ onAdd, disabled }: { onAdd: (name: string, url: string) => void; disabled: boolean }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const errId = useId();
  return (
    <form
      className="card p-4 grid gap-3 md:grid-cols-[1fr_2fr_auto] items-start"
      onSubmit={(e) => {
        e.preventDefault();
        const n = name.trim();
        if (!n) return setError("Give the link a name.");
        if (n.length > 40) return setError("Names can be up to 40 characters.");
        const v = validateCustomUrl(url);
        if (!v.ok) return setError(v.reason);
        onAdd(n, v.url);
        setName("");
        setUrl("");
        setError("");
      }}
      aria-describedby={error ? errId : undefined}
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Link name</span>
        <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Charging map" disabled={disabled} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">HTTPS address</span>
        <input className="input" value={url} inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" disabled={disabled} aria-invalid={Boolean(error)} />
      </label>
      <button className="btn btn-primary md:mt-6" disabled={disabled}>
        <Icon name="plus" size={20} /> Add link
      </button>
      {error && <p id={errId} role="alert" className="text-danger text-sm md:col-span-3">{error}</p>}
      {disabled && <p className="text-muted text-sm md:col-span-3">You&rsquo;ve reached the custom link limit.</p>}
    </form>
  );
}

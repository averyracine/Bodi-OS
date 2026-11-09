"use client";

import { useState } from "react";
import { describeCode, type Place } from "@/lib/weather";
import type { WidgetSize } from "@/lib/widgets";
import { useWeather } from "@/hooks/useWeather";
import { usePrefs } from "../PrefsProvider";
import { Icon } from "../Icon";

export function WeatherWidget({ size }: { size: WidgetSize }) {
  const { prefs, update } = usePrefs();
  const place = prefs?.weather.place ?? null;
  const unit = prefs?.weather.unit ?? "f";
  const w = useWeather(place, unit);
  const [choosing, setChoosing] = useState(false);

  if (!prefs) return null;
  if (choosing || w.status === "no-place") {
    return <PlacePicker onPick={(p) => { update((x) => ({ ...x, weather: { ...x.weather, place: p } })); setChoosing(false); }} onCancel={place ? () => setChoosing(false) : undefined} />;
  }
  if (w.status === "loading") return <div className="skeleton h-24" aria-busy="true" aria-label="Loading weather" />;
  if (w.status === "error")
    return (
      <div role="alert">
        <p className="text-warn text-sm">{w.message}</p>
        <button className="btn btn-sm mt-2" onClick={() => setChoosing(true)}>Change city</button>
      </div>
    );

  const d = describeCode(w.weather.code);
  const deg = "°" + unit.toUpperCase();
  return (
    <div>
      <div className="flex items-center gap-4">
        <Icon name={d.icon} size={44} className="text-accent shrink-0" />
        <div className="min-w-0">
          <p className="font-display text-5xl font-semibold tabular-nums leading-none">{Math.round(w.weather.temp)}{deg}</p>
          <p className="text-muted mt-1 truncate">{d.label} · {w.source === "sample" ? "Sample city" : place?.name}</p>
        </div>
      </div>
      {size === "expanded" && w.weather.days.length > 0 && (
        <ul className="grid grid-cols-4 gap-2 mt-4">
          {w.weather.days.slice(0, 4).map((day, i) => {
            const dd = describeCode(day.code);
            return (
              <li key={day.date} className="rounded-xl bg-surface-3/60 border border-line p-2 text-center">
                <p className="text-xs text-muted">{i === 0 ? "Today" : new Date(day.date + "T12:00").toLocaleDateString([], { weekday: "short" })}</p>
                <Icon name={dd.icon} size={20} className="mx-auto my-1 text-muted" />
                <p className="text-sm tabular-nums"><strong>{Math.round(day.max)}°</strong> <span className="text-muted">{Math.round(day.min)}°</span></p>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-muted">
        {w.source === "sample" ? (
          <span className="chip chip-warn !text-[11px]">Sample weather · not live</span>
        ) : (
          <a className="underline" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Weather data by Open-Meteo.com</a>
        )}
        {w.source === "live" && w.stale && <span>Showing last update.</span>}
        <span className="ml-auto flex gap-1">
          <button className="btn btn-sm btn-ghost !min-h-[40px] !text-xs" onClick={() => update((x) => ({ ...x, weather: { ...x.weather, unit: unit === "f" ? "c" : "f" } }))}>
            °{unit === "f" ? "C" : "F"}
          </button>
          {w.source === "live" && <button className="btn btn-sm btn-ghost !min-h-[40px] !text-xs" onClick={() => setChoosing(true)}>Change city</button>}
        </span>
      </div>
    </div>
  );
}

function PlacePicker({ onPick, onCancel }: { onPick: (p: Place) => void; onCancel?: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const search = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q.trim())}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (r.status === 400) setMsg("Enter a city name, like Austin or Paris, France.");
      else if (!r.ok) setMsg("City search is unavailable right now.");
      else {
        setResults(j.places);
        if (!j.places.length) setMsg("No matching places.");
      }
    } catch {
      setMsg("You're offline.");
    } finally {
      setBusy(false);
    }
  };

  const useDevice = () => {
    if (!("geolocation" in navigator)) return setMsg("This browser can't share location. Search for a city instead.");
    setMsg("Asking this browser for its location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => onPick({ name: "Current location", lat: +pos.coords.latitude.toFixed(3), lon: +pos.coords.longitude.toFixed(3) }),
      () => setMsg("Location wasn't shared. Search for a city instead."),
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">Choose a city for local weather. We never read your car&rsquo;s location.</p>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void search(); }}>
        <label className="flex-1 min-w-0">
          <span className="sr-only">City</span>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="City name" maxLength={60} />
        </label>
        <button className="btn" disabled={busy || q.trim().length < 2}>{busy ? "…" : "Search"}</button>
      </form>
      {results && results.length > 0 && (
        <ul className="flex flex-col gap-1" aria-label="Matching places">
          {results.map((p) => (
            <li key={`${p.lat},${p.lon}`}>
              <button className="w-full text-left min-h-[48px] px-3 rounded-xl hover:bg-surface-3 border border-line" onClick={() => onPick(p)}>{p.name}</button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-sm" onClick={useDevice}><Icon name="compass" size={16} /> Use this device&rsquo;s location</button>
        {onCancel && <button className="btn btn-sm btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
      {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
    </div>
  );
}

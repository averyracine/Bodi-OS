"use client";

import { useEffect, useState } from "react";
import { sampleWeather, type WeatherNow } from "@/lib/weather";
import type { WeatherPlace } from "@/lib/prefs";

export type WeatherState =
  | { status: "no-place" }
  | { status: "loading" }
  | { status: "ready"; source: "live" | "sample"; weather: WeatherNow; stale?: boolean }
  | { status: "error"; message: string };

/** Live from /api/weather; labelled sample when weather isn't configured in this build. */
export function useWeather(place: WeatherPlace | null, unit: "f" | "c"): WeatherState {
  const [state, setState] = useState<WeatherState>({ status: "loading" });
  const key = place ? `${place.lat},${place.lon},${unit}` : `none,${unit}`;

  useEffect(() => {
    let alive = true;
    const set = (s: WeatherState) => alive && setState(s);
    const [lat, lon, u] = key.split(",");
    const run = async () => {
      if (lat === "none") {
        // Without a place we still check availability, so the demo can show labelled sample weather.
        try {
          const r = await fetch("/api/weather?probe=1", { cache: "no-store" });
          if (r.status === 503) return set({ status: "ready", source: "sample", weather: sampleWeather(u as "f" | "c") });
        } catch {
          /* fall through */
        }
        return set({ status: "no-place" });
      }
      set({ status: "loading" });
      try {
        const r = await fetch(`/api/weather?lat=${lat}&lon=${lon}&unit=${u}`, { cache: "no-store" });
        if (r.status === 503) return set({ status: "ready", source: "sample", weather: sampleWeather(u as "f" | "c") });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        set({ status: "ready", source: "live", weather: j.weather, stale: j.stale });
      } catch {
        set({ status: "error", message: navigator.onLine ? "Weather is unavailable right now." : "You're offline." });
      }
    };
    void run();
    const id = setInterval(() => !document.hidden && lat !== "none" && run(), 15 * 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [key]);

  return state;
}

"use client";

import { useState } from "react";
import { CATALOG_BY_ID } from "@/lib/catalog";
import { PRESETS, type PresetId } from "@/lib/presets";
import { usePrefs } from "../PrefsProvider";
import { Icon, type IconName } from "../Icon";
import { ViewLink } from "../Nav";
import { AppTile, recordLaunch, resolveService, type ResolvedService } from "../ServiceTile";

interface Setup {
  id: string;
  title: string;
  blurb: string;
  icon: IconName;
  preset: PresetId;
  apps: string[];
}

/** Curated starting points. Applying one replaces that mode's apps after an in-page confirmation. */
const SETUPS: Setup[] = [
  { id: "game-day", title: "Game day", blurb: "Sports and live streams for a long charge.", icon: "tv", preset: "watch", apps: ["espn", "youtube", "paramount-plus", "prime-video", "twitch", "hbo-max"] },
  { id: "ai-desk", title: "AI desk", blurb: "Four assistants plus mail, calendar and files.", icon: "sparkle", preset: "focus", apps: ["claude", "chatgpt", "gemini", "perplexity", "gmail", "google-calendar", "google-drive", "notion"] },
  { id: "road-trip", title: "Road-trip prep", blurb: "Plan the next leg and charger before you set off.", icon: "route", preset: "drive", apps: ["google-maps", "waze", "plugshare", "supercharger-map", "spotify", "google-calendar"] },
  { id: "cloud-arcade", title: "Cloud arcade", blurb: "Game streaming services. Bring a controller and a strong connection.", icon: "gamepad", preset: "watch", apps: ["gta-vi-xbox", "xbox-cloud", "geforce-now", "twitch", "youtube"] },
];

const SPOTLIGHT = ["claude", "chatgpt", "perplexity", "plugshare"];

export function DiscoverView() {
  const { prefs, update } = usePrefs();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  if (!prefs) return <div className="skeleton h-96" aria-busy="true" aria-label="Loading discover" />;
  const spotlight = SPOTLIGHT.map((id) => resolveService(id, prefs)).filter((x): x is ResolvedService => x !== null);

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <p className="eyebrow">Curated · nothing here is verified in a Tesla yet</p>
        <h1 className="font-display text-3xl font-semibold mt-1">Discover</h1>
      </div>

      <section aria-labelledby="setups-h" className="flex flex-col gap-3">
        <h2 id="setups-h" className="text-lg font-semibold">Ready-made setups</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {SETUPS.map((s) => {
            const mode = PRESETS.find((p) => p.id === s.preset)!;
            return (
              <li key={s.id} className="card p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center w-12 h-12 rounded-2xl bg-accent-soft text-accent shrink-0"><Icon name={s.icon} /></span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg">{s.title}</h3>
                    <p className="text-sm text-muted">{s.blurb}</p>
                  </div>
                </div>
                <p className="text-sm text-muted">
                  {s.apps.map((id) => CATALOG_BY_ID.get(id)?.name).filter(Boolean).join(" · ")}
                </p>
                {done === s.id ? (
                  <p role="status" className="text-accent text-sm flex items-center gap-2">
                    <Icon name="check" size={16} /> Applied to {mode.label}.{" "}
                    <ViewLink view="home" className="underline">See it on Home</ViewLink>
                  </p>
                ) : confirm === s.id ? (
                  <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Confirm ${s.title}`}>
                    <span className="text-sm">Replace your {mode.label} apps?</span>
                    <button className="btn btn-sm btn-primary" onClick={() => {
                      update((p) => ({ ...p, presets: { ...p.presets, [s.preset]: [...s.apps] }, activePreset: s.preset }));
                      setConfirm(null);
                      setDone(s.id);
                    }}>Replace</button>
                    <button className="btn btn-sm" onClick={() => setConfirm(null)}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-sm self-start" onClick={() => setConfirm(s.id)}>
                    Use for {mode.label} mode
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="spot-h" className="flex flex-col gap-3">
        <h2 id="spot-h" className="text-lg font-semibold">Worth a look</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-4">
          {spotlight.map((svc) => <li key={svc.id}><AppTile svc={svc} onLaunch={() => update((p) => recordLaunch(p, svc.id))} /></li>)}
        </ul>
      </section>

      <section aria-labelledby="tips-h" className="grid gap-4 md:grid-cols-3">
        <h2 id="tips-h" className="sr-only">Tips</h2>
        {[
          { icon: "phone" as IconName, t: "Pair from your phone", b: "Sign in on your phone and approve a 5-minute code. No password typing on the car screen.", v: "settings" as const, h: "account" },
          { icon: "layout" as IconName, t: "Make Home yours", b: "Use Customize widgets on Home to show, hide, resize and reorder widgets for each mode.", v: "home" as const, h: undefined },
          { icon: "link" as IconName, t: "Add your own links", b: "Any public https:// site can go in your Library and on Home.", v: "library" as const, h: undefined },
        ].map((x) => (
          <ViewLink key={x.t} view={x.v} hash={x.h} className="card p-5 flex flex-col gap-2 hover:border-line-strong">
            <Icon name={x.icon} className="text-accent" />
            <span className="font-semibold">{x.t}</span>
            <span className="text-sm text-muted">{x.b}</span>
          </ViewLink>
        ))}
      </section>
    </div>
  );
}

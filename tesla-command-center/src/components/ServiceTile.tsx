"use client";

import { useState } from "react";
import { CATALOG_BY_ID, domainOf, monogram, type LaunchBehavior } from "@/lib/catalog";
import type { Preferences } from "@/lib/prefs";
import { MAX_RECENTS } from "@/lib/prefs";
import { useOnline } from "@/hooks/useBrowser";
import { BRAND_ART } from "@/lib/brand-icons";
import { Icon } from "./Icon";

export interface ResolvedService {
  id: string;
  name: string;
  url: string;
  hue: number;
  launch: LaunchBehavior;
  parkedUseOnly: boolean;
  custom: boolean;
}

/** Resolves a favorite id against the catalog and the user's custom links. */
export function resolveService(id: string, prefs: Preferences): ResolvedService | null {
  const svc = CATALOG_BY_ID.get(id);
  if (svc) {
    return { id, name: svc.name, url: svc.url, hue: svc.hue, launch: prefs.launchOverrides[id] ?? svc.launch, parkedUseOnly: svc.parkedUseOnly, custom: false };
  }
  const c = prefs.customLinks.find((l) => l.id === id);
  if (c) {
    let hue = 0;
    for (const ch of c.name) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
    return { id, name: c.name, url: c.url, hue, launch: prefs.launchOverrides[id] ?? "new-tab", parkedUseOnly: false, custom: true };
  }
  return null;
}

export function recordLaunch(prefs: Preferences, id: string): Preferences {
  const recents = [{ id, at: Date.now() }, ...prefs.recents.filter((r) => r.id !== id)].slice(0, MAX_RECENTS);
  return { ...prefs, recents };
}

export function Monogram({ name, hue, size = 64 }: { name: string; hue: number; size?: number }) {
  return (
    <span className="tile-mark shrink-0" style={{ ["--h" as string]: hue, width: size, height: size, fontSize: size * 0.34 }}>
      {monogram(name)}
    </span>
  );
}

/** Perceived-brightness check so text on a brand colour stays readable. */
export function isLight(hex: string): boolean {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

/** The service's logo (or brand-colour wordmark) on its own colour; monogram for custom links. */
export function ServiceArt({ id, name, hue, size = 64, rounded = 16 }: { id: string; name: string; hue: number; size?: number; rounded?: number }) {
  const art = BRAND_ART[id];
  if (!art) return <Monogram name={name} hue={hue} size={size} />;
  return (
    <span
      aria-hidden="true"
      className="grid place-items-center shrink-0 overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
      style={{ width: size, height: size, background: art.bg, color: art.fg, borderRadius: rounded }}
    >
      {art.path ? (
        <svg viewBox="0 0 24 24" width={size * 0.56} height={size * 0.56} fill="currentColor">
          <path d={art.path} />
        </svg>
      ) : (
        <BrandWordmark art={art} size={size} />
      )}
    </span>
  );
}

function BrandWordmark({ art, size }: { art: NonNullable<(typeof BRAND_ART)[string]>; size: number }) {
  const w = art.wordmark!;
  const len = w.text.length;
  return (
    <span
      style={{
        fontSize: size * (len > 6 ? 0.2 : 0.3),
        fontWeight: w.weight ?? 800,
        fontStyle: w.italic ? "italic" : undefined,
        letterSpacing: len > 6 ? "-0.01em" : "0.02em",
        lineHeight: 1,
        textAlign: "center",
        padding: "0 6%",
      }}
    >
      {w.text}
    </span>
  );
}

/**
 * A launch link. Always a top-level navigation to the service's own site;
 * nothing is embedded or proxied. If the browser reports offline, we explain
 * and let the user decide.
 */
export function LaunchLink({
  service,
  onLaunch,
  className,
  children,
  ariaLabel,
}: {
  service: ResolvedService;
  onLaunch?: () => void;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const online = useOnline();
  const [warn, setWarn] = useState(false);
  const newTab = service.launch === "new-tab";
  return (
    <span className="relative block">
      <a
        href={service.url}
        target={newTab ? "_blank" : undefined}
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        className={className}
        aria-label={ariaLabel ?? `Open ${service.name} (${newTab ? "new tab" : "this tab"}, external site)`}
        onClick={(e) => {
          if (!online && !warn) {
            e.preventDefault();
            setWarn(true);
            return;
          }
          setWarn(false);
          onLaunch?.();
        }}
      >
        {children}
      </a>
      {warn && (
        <span role="alert" className="absolute inset-x-2 bottom-2 z-10 rounded-xl bg-surface-3 border border-line p-2 text-sm fade-in">
          You appear to be offline. {service.name} may not load. Tap again to try anyway.
        </span>
      )}
    </span>
  );
}

export function ServiceMeta({ service }: { service: ResolvedService }) {
  return (
    <span className="text-muted text-sm flex items-center gap-1.5">
      <Icon name="external" size={14} />
      {domainOf(service.url)} · {service.launch === "new-tab" ? "new tab" : "this tab"}
    </span>
  );
}

"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { CATALOG_BY_ID, CATEGORY_LABELS, domainOf, monogram, type Category, type LaunchBehavior } from "@/lib/catalog";
import type { Preferences } from "@/lib/prefs";
import { MAX_RECENTS } from "@/lib/prefs";
import { BRAND_TILES } from "@/lib/brand-icons";
import { BRAND_ICON_DATA } from "@/lib/brand-icon-data";
import { useOnline } from "@/hooks/useBrowser";
import { Icon } from "./Icon";

/**
 * Brand logos are bundled (data: URIs, no network) and on by default.
 * Set NEXT_PUBLIC_SERVICE_LOGOS=off to use the monogram icons everywhere.
 */
const LOGOS_ON = process.env.NEXT_PUBLIC_SERVICE_LOGOS !== "off";

export interface ResolvedService {
  id: string;
  name: string;
  url: string;
  hue: number;
  accent: string;
  category: Category;
  launch: LaunchBehavior;
  parkedUseOnly: boolean;
  custom: boolean;
}

/** Resolves a favorite id against the catalog and the user's custom links. */
export function resolveService(id: string, prefs: Preferences): ResolvedService | null {
  const svc = CATALOG_BY_ID.get(id);
  if (svc) {
    return {
      id, name: svc.name, url: svc.url, hue: svc.hue, accent: svc.accent, category: svc.category,
      launch: prefs.launchOverrides[id] ?? svc.launch, parkedUseOnly: svc.parkedUseOnly, custom: false,
    };
  }
  const c = prefs.customLinks.find((l) => l.id === id);
  if (c) {
    let hue = 0;
    for (const ch of c.name) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
    return {
      id, name: c.name, url: c.url, hue, accent: `hsl(${hue} 70% 62%)`, category: "custom",
      launch: prefs.launchOverrides[id] ?? "new-tab", parkedUseOnly: false, custom: true,
    };
  }
  return null;
}

export function recordLaunch(prefs: Preferences, id: string): Preferences {
  const recents = [{ id, at: Date.now() }, ...prefs.recents.filter((r) => r.id !== id)].slice(0, MAX_RECENTS);
  return { ...prefs, recents };
}

/** Initials on a tint of the accent colour. Used only when no logo is available. */
export function Monogram({ name, hue, size = 64, accent }: { name: string; hue: number; size?: number; accent?: string }) {
  return (
    <span
      className="app-icon"
      data-app-icon
      data-icon-kind="fallback"
      style={{ ["--tint" as string]: accent ?? `hsl(${hue} 70% 62%)`, width: size, height: size, fontSize: size * 0.34, borderRadius: size * 0.26 }}
    >
      {monogram(name)}
    </span>
  );
}

/**
 * The one app icon used everywhere (favorites, Quick Launch, Library, Discover,
 * Recently opened, Arrange). Bundled brand logo when we have one; otherwise,
 * or if the image ever fails, the monogram. Never renders blank.
 */
export function AppIcon({ id, name, hue, size = 56, accent }: { id: string; name: string; hue: number; size?: number; accent?: string }) {
  const [failed, setFailed] = useState(false);
  const tile = LOGOS_ON ? BRAND_TILES[id] : undefined;
  const src = tile ? BRAND_ICON_DATA[id] : undefined;
  const tint = accent ?? CATALOG_BY_ID.get(id)?.accent;
  if (!tile || !src || failed) return <Monogram name={name} hue={hue} size={size} accent={tint} />;
  const pct = `${Math.round(tile.scale * 100)}%`;
  return (
    <span
      aria-hidden="true"
      data-app-icon
      data-icon-kind="brand"
      className={`brand-icon ${tile.light ? "brand-icon-light" : ""}`}
      style={{ width: size, height: size, borderRadius: size * 0.26, background: tile.bg }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- bundled data: URI, nothing to optimise */}
      <img src={src} alt="" draggable={false} onError={() => setFailed(true)} style={{ width: pct, height: pct }} />
    </span>
  );
}

/** Kept for API compatibility with earlier code. */
export function isLight(hex: string): boolean {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
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
  style,
}: {
  service: ResolvedService;
  onLaunch?: () => void;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  style?: CSSProperties;
}) {
  const online = useOnline();
  const [warn, setWarn] = useState(false);
  const newTab = service.launch === "new-tab";
  return (
    <span className="relative block h-full">
      <a
        href={service.url}
        target={newTab ? "_blank" : undefined}
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        className={className}
        style={style}
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

/** Launcher tile: the logo leads, the name stays visible, a subtle arrow marks it as a launch. */
export function AppCard({ svc, onLaunch, starred = false, compact = false }: { svc: ResolvedService; onLaunch?: () => void; starred?: boolean; compact?: boolean }) {
  return (
    <LaunchLink service={svc} onLaunch={onLaunch} className={`app-card group ${compact ? "!min-h-[120px]" : ""}`} style={{ ["--tint" as string]: svc.accent }}>
      <span className="flex items-start justify-between gap-2">
        <AppIcon id={svc.id} name={svc.name} hue={svc.hue} accent={svc.accent} size={compact ? 48 : 64} />
        <span className="flex items-center gap-1.5 text-muted">
          {starred && <Icon name="star" size={14} className="fill-current text-accent" />}
          <span className="launch-hint grid place-items-center w-8 h-8 rounded-full border border-line">
            <Icon name="external" size={15} />
          </span>
        </span>
      </span>
      <span className="mt-auto min-w-0">
        <span className="block text-[1.05rem] font-semibold leading-tight break-words">{svc.name}</span>
        <span className="block text-xs text-muted mt-0.5">
          {CATEGORY_LABELS[svc.category]} · {svc.launch === "new-tab" ? "new tab" : "this tab"}
        </span>
      </span>
    </LaunchLink>
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

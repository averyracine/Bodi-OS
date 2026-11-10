"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { CATALOG_BY_ID, domainOf, monogram, type Category, type LaunchBehavior } from "@/lib/catalog";
import type { Preferences } from "@/lib/prefs";
import { MAX_RECENTS } from "@/lib/prefs";
import { BRAND_TILES } from "@/lib/brand-icons";
import { BRAND_ICON_DATA } from "@/lib/brand-icon-data";
import { useOnline } from "@/hooks/useBrowser";
import { Icon } from "./Icon";
import { GuideButton } from "./GameGuide";

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

/**
 * The branded 4:3 tile used in every app grid. Brand background edge to edge,
 * logo centred at its own proportions and sized per app (see brand-icons.ts).
 * Initials only for custom links, apps without a logo, or a failed image.
 */
export function BrandArt({ id, name, accent, className = "" }: { id: string; name: string; accent: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const text = CATALOG_BY_ID.get(id)?.textTile;
  if (text) {
    // Our own text/icon tile: no third-party logos, cover art or screenshots.
    return (
      <span
        aria-hidden="true"
        data-app-icon
        data-icon-kind="text"
        className={`brand-tile brand-tile-fallback brand-tile-text ${className}`}
        style={{ ["--tint" as string]: accent }}
      >
        <Icon name={text.icon} size={28} className="brand-tile-text-icon" />
        <span className="brand-tile-text-label">{text.label}</span>
      </span>
    );
  }
  const tile = LOGOS_ON ? BRAND_TILES[id] : undefined;
  const src = tile ? BRAND_ICON_DATA[id] : undefined;
  if (!tile || !src || failed) {
    return (
      <span
        aria-hidden="true"
        data-app-icon
        data-icon-kind="fallback"
        className={`brand-tile brand-tile-fallback ${className}`}
        style={{ ["--tint" as string]: accent }}
      >
        <span className="brand-tile-initials">{monogram(name)}</span>
      </span>
    );
  }
  return (
    <span aria-hidden="true" data-app-icon data-icon-kind="brand" className={`brand-tile ${tile.light ? "brand-tile-light" : ""} ${className}`} style={{ background: tile.bg }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- bundled data: URI, nothing to optimise */}
      <img
        src={src}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
        style={{ height: `${tile.h * 100}%`, maxWidth: `${(tile.maxW ?? 0.78) * 100}%` }}
      />
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

/**
 * Launcher tile: the branded tile is the target, the name sits underneath.
 * The whole thing is one link, so the touch target covers tile and label.
 */
export function AppTile({ svc, onLaunch, compact = false }: { svc: ResolvedService; onLaunch?: () => void; compact?: boolean }) {
  const guide = !compact && !svc.custom ? CATALOG_BY_ID.get(svc.id)?.guide : undefined;
  if (guide) {
    // The info button can't live inside the link, so it sits beside it over the tile.
    return (
      <span className="relative block">
        <AppTileLink svc={svc} onLaunch={onLaunch} compact={compact} />
        <GuideButton name={svc.name} className="absolute top-1 left-1" />
      </span>
    );
  }
  return <AppTileLink svc={svc} onLaunch={onLaunch} compact={compact} />;
}

function AppTileLink({ svc, onLaunch, compact }: { svc: ResolvedService; onLaunch?: () => void; compact: boolean }) {
  return (
    <LaunchLink service={svc} onLaunch={onLaunch} className={`app-tile group ${compact ? "app-tile-compact" : ""}`}>
      <span className="relative block">
        <BrandArt id={svc.id} name={svc.name} accent={svc.accent} />
        <span className="tile-hint" aria-hidden="true"><Icon name="external" size={compact ? 11 : 13} /></span>
        {svc.launch === "same-tab" && !compact && <span className="tile-badge">Opens here</span>}
      </span>
      <span className="app-tile-label">{svc.name}</span>
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

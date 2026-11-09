"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { CATALOG_BY_ID, CATEGORY_LABELS, domainOf, monogram, type Category, type LaunchBehavior } from "@/lib/catalog";
import type { Preferences } from "@/lib/prefs";
import { MAX_RECENTS } from "@/lib/prefs";
import { BRAND_ART } from "@/lib/brand-icons";
import { useOnline } from "@/hooks/useBrowser";
import { Icon } from "./Icon";

/**
 * Third-party logos are off by default (not authorised by their owners).
 * Set NEXT_PUBLIC_SERVICE_LOGOS=on only after obtaining permission.
 */
const LOGOS_ON = process.env.NEXT_PUBLIC_SERVICE_LOGOS === "on";

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

/** Kept for custom-link fallbacks and older call sites. */
export function Monogram({ name, hue, size = 64 }: { name: string; hue: number; size?: number }) {
  return (
    <span className="app-icon" style={{ ["--tint" as string]: `hsl(${hue} 70% 62%)`, width: size, height: size, fontSize: size * 0.34, borderRadius: size * 0.28 }}>
      {monogram(name)}
    </span>
  );
}

/** Icon for a service: our own monogram on a tint of its accent colour (logos only when enabled). */
export function ServiceArt({ id, name, hue, size = 48, accent }: { id: string; name: string; hue: number; size?: number; rounded?: number; accent?: string }) {
  const tint = accent ?? CATALOG_BY_ID.get(id)?.accent ?? `hsl(${hue} 70% 62%)`;
  const art = LOGOS_ON ? BRAND_ART[id] : undefined;
  return (
    <span
      aria-hidden="true"
      className="app-icon"
      style={{ ["--tint" as string]: tint, width: size, height: size, borderRadius: size * 0.28, fontSize: size * 0.34 }}
    >
      {art?.path ? (
        <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="currentColor"><path d={art.path} /></svg>
      ) : (
        monogram(name)
      )}
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

/** Premium app card used on Home and Discover. */
export function AppCard({ svc, onLaunch, starred = false, compact = false }: { svc: ResolvedService; onLaunch?: () => void; starred?: boolean; compact?: boolean }) {
  return (
    <LaunchLink service={svc} onLaunch={onLaunch} className={`app-card group ${compact ? "!min-h-[112px]" : ""}`} style={{ ["--tint" as string]: svc.accent }}>
      <span className="flex items-start justify-between gap-2">
        <ServiceArt id={svc.id} name={svc.name} hue={svc.hue} accent={svc.accent} size={compact ? 40 : 52} />
        <span className="flex items-center gap-1.5 text-muted">
          {starred && <Icon name="star" size={14} className="fill-current text-accent" />}
          <span className="grid place-items-center w-8 h-8 rounded-full border border-line opacity-70 group-hover:opacity-100 group-hover:text-fg transition-opacity">
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

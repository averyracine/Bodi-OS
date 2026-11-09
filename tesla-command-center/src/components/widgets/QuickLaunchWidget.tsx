"use client";

import type { WidgetSize } from "@/lib/widgets";
import { usePrefs } from "../PrefsProvider";
import { LaunchLink, recordLaunch, resolveService, ServiceArt, type ResolvedService } from "../ServiceTile";
import { ViewLink } from "../Nav";

export function QuickLaunchWidget({ size }: { size: WidgetSize }) {
  const { prefs, update } = usePrefs();
  if (!prefs) return null;
  const items = prefs.quickLaunch.map((id) => resolveService(id, prefs)).filter((x): x is ResolvedService => x !== null);
  if (items.length === 0)
    return <p className="text-sm text-muted">Pick apps for Quick Launch in the <ViewLink view="library" className="text-accent underline">Library</ViewLink>.</p>;
  return (
    <ul className={size === "expanded" ? "flex flex-col gap-1" : "grid grid-cols-4 sm:grid-cols-5 gap-2"} aria-label="Quick Launch apps">
      {items.map((svc) => (
        <li key={svc.id}>
          <LaunchLink
            service={svc}
            onLaunch={() => update((p) => recordLaunch(p, svc.id))}
            className={size === "expanded"
              ? "flex items-center gap-3 min-h-[56px] px-2 rounded-xl hover:bg-surface-3"
              : "flex flex-col items-center gap-1.5 min-h-[76px] py-1 rounded-xl hover:bg-surface-3 text-center"}
          >
            <ServiceArt id={svc.id} name={svc.name} hue={svc.hue} accent={svc.accent} size={size === "expanded" ? 40 : 44} />
            <span className={size === "expanded" ? "font-medium" : "text-[11px] leading-tight text-muted line-clamp-2"}>{svc.name}</span>
          </LaunchLink>
        </li>
      ))}
    </ul>
  );
}

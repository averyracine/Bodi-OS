"use client";

import type { WidgetSize } from "@/lib/widgets";
import { usePrefs } from "../PrefsProvider";
import { AppTile, recordLaunch, resolveService, type ResolvedService } from "../ServiceTile";
import { ViewLink } from "../Nav";

export function QuickLaunchWidget({ size }: { size: WidgetSize }) {
  const { prefs, update } = usePrefs();
  if (!prefs) return null;
  const items = prefs.quickLaunch.map((id) => resolveService(id, prefs)).filter((x): x is ResolvedService => x !== null);
  if (items.length === 0)
    return <p className="text-sm text-muted">Pick apps for Quick Launch in the <ViewLink view="library" className="text-accent underline">Library</ViewLink>.</p>;
  return (
    <ul className={`grid gap-x-2.5 gap-y-3 ${size === "expanded" ? "grid-cols-2" : "grid-cols-3"}`} aria-label="Quick Launch apps">
      {items.map((svc) => (
        <li key={svc.id}>
          <AppTile svc={svc} compact={size === "compact"} onLaunch={() => update((p) => recordLaunch(p, svc.id))} />
        </li>
      ))}
    </ul>
  );
}

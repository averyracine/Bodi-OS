"use client";

import { PRESETS, type PresetId } from "@/lib/presets";
import { usePrefs } from "./PrefsProvider";
import { Icon, type IconName } from "./Icon";

export const MODE_ICON: Record<PresetId, IconName> = { watch: "tv", listen: "headphones", focus: "briefcase", drive: "route" };

/** Watch / Listen / Work / Drive. Screen layouts, not vehicle modes. */
export function ModeSelector({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { prefs, update } = usePrefs();
  if (!prefs) return <div className={`skeleton h-12 w-72 ${className}`} />;
  return (
    <div role="radiogroup" aria-label="Mode" className={`mode-seg ${className}`}>
      {PRESETS.map((p) => (
        <button
          key={p.id}
          role="radio"
          aria-checked={p.id === prefs.activePreset}
          onClick={() => update((x) => ({ ...x, activePreset: p.id }))}
          className={compact ? "!px-3" : ""}
        >
          <Icon name={MODE_ICON[p.id]} size={17} className="hidden sm:block shrink-0" />
          {p.label}
        </button>
      ))}
    </div>
  );
}

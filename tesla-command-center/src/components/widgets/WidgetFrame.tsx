"use client";

import type { ReactNode } from "react";
import type { WidgetId, WidgetSize } from "@/lib/widgets";
import { Icon } from "../Icon";

export interface WidgetControls {
  editing: boolean;
  first: boolean;
  last: boolean;
  size: WidgetSize;
  onMove: (d: -1 | 1) => void;
  onToggleSize: () => void;
  onHide: () => void;
}

export function WidgetFrame({ id, title, badge, controls, children }: { id: WidgetId; title: string; badge?: ReactNode; controls: WidgetControls; children: ReactNode }) {
  return (
    <section className="card p-4 sm:p-5 fade-in" aria-labelledby={`w-${id}`} data-widget={id}>
      <div className="flex items-center gap-2 min-h-[28px]">
        <h2 id={`w-${id}`} className="eyebrow mr-auto">{title}</h2>
        {!controls.editing && badge}
        {controls.editing && (
          <span className="flex gap-1" role="group" aria-label={`${title} widget controls`}>
            <button className="btn btn-sm !min-h-[44px] !px-2.5" aria-label={`Move ${title} up`} disabled={controls.first} onClick={() => controls.onMove(-1)}><Icon name="up" size={18} /></button>
            <button className="btn btn-sm !min-h-[44px] !px-2.5" aria-label={`Move ${title} down`} disabled={controls.last} onClick={() => controls.onMove(1)}><Icon name="down" size={18} /></button>
            <button className="btn btn-sm !min-h-[44px] !px-2.5" aria-label={`${controls.size === "compact" ? "Expand" : "Compact"} ${title}`} aria-pressed={controls.size === "expanded"} onClick={controls.onToggleSize}>
              <Icon name={controls.size === "compact" ? "expand" : "shrink"} size={16} />
            </button>
            <button className="btn btn-sm btn-danger !min-h-[44px] !px-2.5" aria-label={`Hide ${title}`} onClick={controls.onHide}><Icon name="eyeOff" size={16} /></button>
          </span>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

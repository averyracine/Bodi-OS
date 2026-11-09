"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "./AppShell";
import { NavProvider, type ViewId } from "./Nav";
import { PrefsProvider } from "./PrefsProvider";
import { HomeView } from "./views/HomeView";
import { LibraryView } from "./views/LibraryView";
import { FocusView } from "./views/FocusView";
import { SettingsView } from "./views/SettingsView";
import { DiscoverView } from "./views/DiscoverView";

const W = 1280;
const H = 800;

/**
 * The real dashboard components, rendered at 1280×800 and scaled to fit.
 * Uses an in-memory preferences store so playing here never touches the
 * visitor's saved setup.
 */
export function DashboardPreview() {
  const [view, setView] = useState<ViewId>("home");
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrap} className="w-full min-w-0">
      <div
        className="relative overflow-hidden rounded-[22px] border border-line shadow-[0_40px_120px_-40px_rgba(82,207,228,0.25)]"
        style={{ height: scale ? H * scale : undefined, aspectRatio: scale ? undefined : `${W} / ${H}` }}
        role="region"
        aria-label="Interactive dashboard preview"
      >
        {scale > 0 && (
          <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <PrefsProvider persistent={false}>
              <NavProvider select={setView}>
                <AppShell active={view} demo accountLabel="Preview" className="relative h-full">
                  {view === "home" && <HomeView />}
                  {view === "library" && <LibraryView />}
                  {view === "focus" && <FocusView />}
                  {view === "settings" && <SettingsView />}
                  {view === "discover" && <DiscoverView />}
                </AppShell>
              </NavProvider>
            </PrefsProvider>
          </div>
        )}
      </div>
    </div>
  );
}

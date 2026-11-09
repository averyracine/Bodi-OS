"use client";

import type { ReactNode } from "react";
import { useNow, useOnline } from "@/hooks/useBrowser";
import { BrandName } from "./BrandMark";
import { Icon, type IconName } from "./Icon";
import { usePrefs } from "./PrefsProvider";
import { ViewLink, type ViewId } from "./Nav";

const DOCK: { id: ViewId; label: string; icon: IconName }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "library", label: "Library", icon: "grid" },
  { id: "focus", label: "Focus", icon: "focus" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export function AppShell({
  active,
  children,
  demo,
  accountLabel,
  className = "min-h-dvh",
}: {
  active: ViewId;
  children: ReactNode;
  demo: boolean;
  accountLabel: string;
  className?: string;
}) {
  const { prefs, preview } = usePrefs();
  const online = useOnline();
  const now = useNow(15_000);

  return (
    <div
      data-theme={prefs?.theme ?? "graphite"}
      data-motion={prefs?.reducedMotion === "on" ? "reduce" : prefs?.reducedMotion === "off" ? "full" : "system"}
      className={`app-bg text-fg flex flex-col ${className}`}
    >
      <header className="flex items-center gap-3 px-5 lg:px-8 h-[72px] shrink-0 border-b border-line/60">
        <ViewLink view="home" className="rounded-xl" ariaLabel="Command Center home">
          <BrandName compact />
        </ViewLink>
        <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
          {!online && (
            <span className="chip chip-warn" role="status">
              <Icon name="offline" size={14} /> Offline
            </span>
          )}
          <span className="chip hidden md:inline-flex" title="This web page can't read vehicle state, so it can't detect Park.">
            <Icon name="shield" size={14} /> For use while parked
          </span>
          {(demo || preview) && (
            <span className="chip chip-accent" title="No account, no payments. Everything stays in this browser.">
              {preview ? "Interactive preview" : "Demo mode"}
            </span>
          )}
          <span className="text-xl font-semibold tabular-nums min-w-[5.5ch] text-right" aria-label="Current time">
            {now ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : " "}
          </span>
        </div>
      </header>

      <main id="main" className="flex-1 min-h-0 overflow-y-auto px-5 lg:px-8 pt-5 pb-32">
        {children}
      </main>

      <nav
        aria-label="Primary"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-stretch gap-1 p-1.5 rounded-[22px] border border-line bg-surface/95 backdrop-blur shadow-2xl"
        style={preview ? { position: "absolute" } : undefined}
      >
        {DOCK.map((d) => (
          <ViewLink
            key={d.id}
            view={d.id}
            ariaCurrent={active === d.id}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[84px] min-h-[64px] px-3 rounded-2xl text-sm font-semibold transition-colors ${
              active === d.id ? "bg-accent-soft text-accent" : "text-muted hover:text-fg hover:bg-surface-3"
            }`}
          >
            <Icon name={d.icon} size={24} />
            {d.label}
          </ViewLink>
        ))}
        <span className="w-px bg-line my-2 mx-1" aria-hidden="true" />
        <ViewLink
          view="settings"
          hash="account"
          className="flex flex-col items-center justify-center gap-0.5 min-w-[84px] min-h-[64px] px-3 rounded-2xl text-sm font-semibold text-muted hover:text-fg hover:bg-surface-3"
          ariaLabel={`Profile: ${accountLabel}`}
        >
          <Icon name="user" size={24} />
          <span className="max-w-[9ch] truncate">{accountLabel}</span>
        </ViewLink>
      </nav>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNow, useOnline } from "@/hooks/useBrowser";
import { PRESETS } from "@/lib/presets";
import { BrandMark } from "./BrandMark";
import { Icon, type IconName } from "./Icon";
import { usePrefs } from "./PrefsProvider";
import { ViewLink, type ViewId } from "./Nav";
import { QuotesProvider } from "./markets/QuotesProvider";
import { TickerBar } from "./markets/TickerBar";

const DOCK: { id: ViewId; label: string; icon: IconName; mobile: boolean }[] = [
  { id: "home", label: "Home", icon: "home", mobile: true },
  { id: "library", label: "Library", icon: "grid", mobile: true },
  { id: "focus", label: "Focus", icon: "focus", mobile: true },
  { id: "discover", label: "Discover", icon: "compass", mobile: false },
  { id: "settings", label: "Settings", icon: "settings", mobile: false },
];

export function formatTime(d: Date, fmt: "auto" | "12h" | "24h") {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", ...(fmt === "auto" ? {} : { hour12: fmt === "12h" }) });
}

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
  const [moreOpen, setMoreOpen] = useState(false);
  const [parkedOpen, setParkedOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const mode = PRESETS.find((p) => p.id === prefs?.activePreset);

  useEffect(() => {
    if (!moreOpen && !parkedOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoreOpen(false);
        setParkedOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen, parkedOpen]);

  const dockItem = (active_: boolean) =>
    `relative flex flex-col items-center justify-center gap-1 min-w-[76px] sm:min-w-[88px] min-h-[60px] px-2 rounded-[18px] text-[13px] font-semibold transition-colors ${
      active_ ? "text-accent bg-accent-soft" : "text-muted hover:text-fg hover:bg-surface-3/70"
    }`;

  return (
    <QuotesProvider>
      <div
        data-theme={prefs?.theme ?? "graphite"}
        data-motion={prefs?.reducedMotion === "on" ? "reduce" : prefs?.reducedMotion === "off" ? "full" : "system"}
        className={`app-bg text-fg flex flex-col ${className}`}
      >
        <header className="glass !border-x-0 !border-t-0 sticky top-0 z-30 shrink-0" style={preview ? { position: "relative" } : undefined}>
          <div className="flex items-center gap-3 h-14 px-4 lg:px-6">
            <ViewLink view="home" className="flex items-center gap-2.5 rounded-xl" ariaLabel="Command Center home">
              <BrandMark size={28} />
              <span className="font-display font-semibold text-[15px] hidden sm:inline">Command Center</span>
            </ViewLink>
            {mode && (
              <span className="chip !text-fg hidden md:inline-flex" aria-label={`Active mode: ${mode.label}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" /> {mode.label} mode
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="relative">
                <button
                  type="button"
                  className="chip !py-1.5 hover:!text-fg"
                  aria-expanded={parkedOpen}
                  aria-controls="parked-note"
                  onClick={() => setParkedOpen((o) => !o)}
                >
                  <Icon name="shield" size={14} /> <span className="hidden lg:inline">Parked use</span>
                  <span className="sr-only lg:hidden">Parked use information</span>
                </button>
                {parkedOpen && (
                  <span id="parked-note" role="note" className="absolute right-0 top-full mt-2 w-72 glass rounded-2xl p-4 text-sm text-muted shadow-2xl z-40 fade-in">
                    <strong className="text-fg">For use while parked.</strong> This is a web page: it can&rsquo;t see your car&rsquo;s gear, speed or
                    location, so it can&rsquo;t check for you. Video and interactive apps are for when you&rsquo;re stopped.
                  </span>
                )}
              </span>
              <span role="status" className={`chip !py-1.5 ${online ? "" : "chip-warn"}`} title={online ? "Connected" : "No connection"}>
                <Icon name={online ? "wifi" : "offline"} size={14} />
                <span className={online ? "hidden md:inline" : ""}>{online ? "Online" : "Offline"}</span>
              </span>
              <ViewLink
                view="settings"
                hash="account"
                className={`chip !py-1.5 ${demo || preview ? "chip-accent" : "hover:!text-fg"}`}
                ariaLabel={`Account: ${preview ? "Interactive preview" : demo ? "Demo mode" : accountLabel}`}
              >
                <Icon name="user" size={14} />
                <span className="hidden sm:inline">{preview ? "Interactive preview" : demo ? "Demo mode" : accountLabel}</span>
              </ViewLink>
              <span className="font-display text-lg font-semibold tabular-nums min-w-[5ch] text-right" aria-label="Current time">
                {now ? formatTime(now, prefs?.clockFormat ?? "auto") : " "}
              </span>
            </div>
          </div>
          <TickerBar />
        </header>

        <main
          id="main"
          className="flex-1 min-h-0 px-4 lg:px-6 pt-5"
          style={{ paddingBottom: "calc(var(--dock-h) + 40px + env(safe-area-inset-bottom, 0px))" }}
        >
          {children}
        </main>

        <nav
          aria-label="Primary"
          className="glass dock fixed left-1/2 -translate-x-1/2 z-40 rounded-[26px] p-1.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85)]"
          style={{ bottom: "calc(14px + env(safe-area-inset-bottom, 0px))", ...(preview ? { position: "absolute" } : {}) }}
        >
          <div className="flex items-stretch gap-1" ref={moreRef}>
            {DOCK.map((d) => (
              <ViewLink
                key={d.id}
                view={d.id}
                ariaCurrent={active === d.id}
                className={`${dockItem(active === d.id)} ${d.mobile ? "flex" : "hidden sm:flex"}`}
              >
                <Icon name={d.icon} size={22} />
                {d.label}
                {active === d.id && <span aria-hidden="true" className="absolute bottom-1 w-5 h-0.5 rounded-full bg-accent" />}
              </ViewLink>
            ))}
            <span className="relative sm:hidden flex">
              <button
                type="button"
                className={dockItem(active === "discover" || active === "settings")}
                aria-expanded={moreOpen}
                aria-controls="dock-more"
                onClick={() => setMoreOpen((o) => !o)}
              >
                <Icon name="more" size={22} />
                More
              </button>
              {moreOpen && (
                <span id="dock-more" className="absolute bottom-full right-0 mb-2 w-48 glass rounded-2xl p-1.5 flex flex-col shadow-2xl fade-in">
                  {DOCK.filter((d) => !d.mobile).map((d) => (
                    <ViewLink
                      key={d.id}
                      view={d.id}
                      ariaCurrent={active === d.id}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 min-h-[52px] px-3 rounded-xl font-semibold ${active === d.id ? "text-accent bg-accent-soft" : "hover:bg-surface-3"}`}
                    >
                      <Icon name={d.icon} size={20} /> {d.label}
                    </ViewLink>
                  ))}
                </span>
              )}
            </span>
          </div>
        </nav>
      </div>
    </QuotesProvider>
  );
}

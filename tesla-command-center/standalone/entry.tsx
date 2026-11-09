import { useEffect, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import Landing from "@/app/page";
import Start from "@/app/start/page";
import { AppShell } from "@/components/AppShell";
import { NavProvider, type ViewId } from "@/components/Nav";
import { PrefsProvider } from "@/components/PrefsProvider";
import { ConsentBanner } from "@/components/ConsentBanner";
import { HomeView } from "@/components/views/HomeView";
import { LibraryView } from "@/components/views/LibraryView";
import { FocusView } from "@/components/views/FocusView";
import { SettingsView } from "@/components/views/SettingsView";

// The hosted viewer blocks file downloads; Settings explains that instead of failing silently.
(globalThis as { __TCC_NO_DOWNLOADS__?: boolean }).__TCC_NO_DOWNLOADS__ = true;

// No server in this build: answer API calls exactly like the real app does in demo mode.
const realFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const path = url.startsWith("/") ? url : new URL(url, location.href).pathname;
  if (path.startsWith("/api/session")) {
    return Response.json({ mode: "demo", configured: { auth: false, billing: false }, actor: null });
  }
  if (path.startsWith("/api/events")) return Response.json({ ok: true, stored: false });
  if (path.startsWith("/api/")) {
    return Response.json({ error: "not_configured", message: "Not available in this browser-only demo." }, { status: 503 });
  }
  return realFetch(input, init);
};

const VIEW_FOR_HASH: Record<string, ViewId> = { dashboard: "home", library: "library", focus: "focus", preferences: "settings" };
const HASH_FOR_VIEW: Record<ViewId, string> = { home: "dashboard", library: "library", focus: "focus", settings: "preferences" };

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const useHash = () => useSyncExternalStore(subscribe, () => location.hash.slice(1), () => "");

function App() {
  const hash = useHash();
  const view = VIEW_FOR_HASH[hash];
  useEffect(() => {
    if (VIEW_FOR_HASH[hash] || hash === "get-started" || hash === "") window.scrollTo(0, 0);
  }, [hash]);

  let page;
  if (view) {
    page = (
      <NavProvider select={(v) => (location.hash = HASH_FOR_VIEW[v])}>
        <AppShell active={view} demo accountLabel="Demo">
          {view === "home" && <HomeView />}
          {view === "library" && <LibraryView />}
          {view === "focus" && <FocusView />}
          {view === "settings" && <SettingsView />}
        </AppShell>
      </NavProvider>
    );
  } else if (hash === "get-started") {
    page = <Start />;
  } else {
    page = <Landing />;
  }
  return (
    <PrefsProvider>
      {page}
      <ConsentBanner />
    </PrefsProvider>
  );
}

document.documentElement.setAttribute("data-theme", "graphite");
createRoot(document.getElementById("root")!).render(<App />);

"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import type { ViewId } from "@/components/Nav";
import { useSession } from "@/hooks/useSession";

function viewFor(path: string): ViewId {
  if (path.startsWith("/app/library")) return "library";
  if (path.startsWith("/app/focus")) return "focus";
  if (path.startsWith("/app/settings")) return "settings";
  return "home";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const session = useSession();
  const s = session.state === "ready" ? session.session : null;
  const demo = s?.mode === "demo";
  const label = !s ? "Profile" : demo ? "Demo" : s.actor?.kind === "user" ? "Account" : s.actor?.kind === "device" ? "Car" : "Sign in";
  return (
    <AppShell active={viewFor(path)} demo={demo} accountLabel={label}>
      {children}
    </AppShell>
  );
}

import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardFrame } from "@/components/DashboardFrame";
import { isSupabaseConfigured } from "@/lib/env";
import { getActor } from "@/lib/request";
import { getAccess } from "@/lib/access";

/**
 * Server-side gate for the dashboard. With accounts configured, /app requires a
 * signed-in user (or a car paired to one) whose account has an active
 * subscription or an owner/test entitlement. Without Supabase configured the
 * build is the labelled local demo and stays open.
 */
async function Gate({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) return <>{children}</>;
  const actor = await getActor();
  if (!actor) redirect("/login?next=/app");
  const access = await getAccess(actor.userId);
  if (!access.allowed) redirect("/subscribe");
  return <>{children}</>;
}

function Checking() {
  return (
    <div className="app-bg min-h-dvh grid place-items-center p-6" aria-busy="true">
      <p className="text-muted">Checking your access…</p>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Checking />}>
      <Gate>
        <DashboardFrame>{children}</DashboardFrame>
      </Gate>
    </Suspense>
  );
}

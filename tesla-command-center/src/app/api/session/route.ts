import { connection } from "next/server";
import { isBillingConfigured, isSupabaseConfigured } from "@/lib/env";
import { getActor, json } from "@/lib/request";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getUserSubscription } from "@/lib/billing/supabase-store";
import { getAccess } from "@/lib/access";

/** Describes what this browser is: demo, signed-out, signed-in user, or paired car. */
export async function GET() {
  await connection(); // always per-request: depends on cookies and env
  const configured = { auth: isSupabaseConfigured(), billing: isBillingConfigured() };
  if (!configured.auth) return json({ mode: "demo", configured, actor: null });

  const actor = await getActor();
  if (!actor) return json({ mode: "live", configured, actor: null });

  const admin = getAdminSupabase();
  const [sub, access] = await Promise.all([admin ? getUserSubscription(admin, actor.userId) : null, getAccess(actor.userId)]);
  return json({
    mode: "live",
    configured,
    actor: actor.kind === "user" ? { kind: "user", email: actor.email } : { kind: "device" },
    subscription: sub
      ? { status: sub.status, currentPeriodEnd: sub.current_period_end, cancelAtPeriodEnd: sub.cancel_at_period_end }
      : null,
    premium: access.allowed,
    access: access.via,
  });
}

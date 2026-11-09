import { connection } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/billing/supabase-store";
import { hasPremiumAccess } from "@/lib/billing/reconcile";
import { json, notConfigured } from "@/lib/request";

export async function GET() {
  await connection(); // always per-request: depends on cookies and env
  const admin = getAdminSupabase();
  if (!admin) return notConfigured("Billing");
  const user = await getSessionUser();
  if (!user) return json({ error: "unauthenticated" }, 401);
  const sub = await getUserSubscription(admin, user.id);
  return json({
    premium: hasPremiumAccess(sub),
    status: sub?.status ?? "none",
    currentPeriodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
  });
}

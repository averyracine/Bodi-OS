import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase } from "./supabase/admin";
import { getServerSupabase, getSessionUser } from "./supabase/server";
import type { SubscriptionRow } from "./billing/reconcile";
import { decideAccess, type AccessVia, type EntitlementRow } from "./access-rules";

export type { AccessVia };

async function read(db: SupabaseClient, userId: string) {
  const [sub, ent] = await Promise.all([
    db.from("subscriptions").select("status, current_period_end").eq("user_id", userId)
      .order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("entitlements").select("kind, revoked_at").eq("user_id", userId).maybeSingle(),
  ]);
  return decideAccess((sub.data as Pick<SubscriptionRow, "status" | "current_period_end"> | null) ?? null, (ent.data as EntitlementRow | null) ?? null);
}

/**
 * The single server-side answer to "may this user use the paid dashboard?":
 * an active webhook-maintained subscription or an unrevoked owner_test
 * entitlement. Uses the service role when configured; otherwise, only for the
 * signed-in user themself, the user's own session under row-level security
 * (users can read their own subscription and entitlement rows, never write them).
 */
export async function getAccess(userId: string): Promise<{ allowed: boolean; via: AccessVia }> {
  const admin = getAdminSupabase();
  if (admin) return read(admin, userId);
  const me = await getSessionUser();
  const db = await getServerSupabase();
  if (!me || me.id !== userId || !db) return { allowed: false, via: null };
  return read(db, userId);
}

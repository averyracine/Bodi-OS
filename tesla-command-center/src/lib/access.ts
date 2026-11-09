import "server-only";
import { getAdminSupabase } from "./supabase/admin";
import { getUserSubscription } from "./billing/supabase-store";
import { decideAccess, type AccessVia, type EntitlementRow } from "./access-rules";

export type { AccessVia };

/**
 * The single server-side answer to "may this user use the paid dashboard?".
 * Reads the webhook-maintained subscription and the owner entitlement with the
 * service role. Nothing from the client is trusted.
 */
export async function getAccess(userId: string): Promise<{ allowed: boolean; via: AccessVia }> {
  const admin = getAdminSupabase();
  if (!admin) return { allowed: false, via: null };
  const [sub, ent] = await Promise.all([
    getUserSubscription(admin, userId),
    admin.from("entitlements").select("kind, revoked_at").eq("user_id", userId).maybeSingle(),
  ]);
  return decideAccess(sub, (ent.data as EntitlementRow | null) ?? null);
}

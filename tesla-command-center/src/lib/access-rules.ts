import { hasPremiumAccess, type SubscriptionRow } from "./billing/reconcile";

export type AccessVia = "subscription" | "owner" | null;
export interface EntitlementRow { kind: string; revoked_at: string | null }

/** Pure access rule: an active subscription, or an unrevoked owner_test entitlement. */
export function decideAccess(
  sub: Pick<SubscriptionRow, "status" | "current_period_end"> | null,
  ent: EntitlementRow | null,
  now = Date.now(),
): { allowed: boolean; via: AccessVia } {
  if (hasPremiumAccess(sub, now)) return { allowed: true, via: "subscription" };
  if (ent && ent.kind === "owner_test" && ent.revoked_at === null) return { allowed: true, via: "owner" };
  return { allowed: false, via: null };
}

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingStore, SubscriptionRow } from "./reconcile";

export function supabaseBillingStore(db: SupabaseClient): BillingStore {
  return {
    async recordEvent(id, type) {
      const { error } = await db.from("stripe_events").insert({ id, type });
      if (!error) return true;
      if (error.code === "23505") return false; // unique violation → duplicate delivery
      throw error;
    },
    async forgetEvent(id) {
      await db.from("stripe_events").delete().eq("id", id);
    },
    async getSubscription(id) {
      const { data, error } = await db.from("subscriptions").select("*").eq("stripe_subscription_id", id).maybeSingle();
      if (error) throw error;
      return (data as SubscriptionRow | null) ?? null;
    },
    async upsertSubscription(row) {
      const { error } = await db
        .from("subscriptions")
        .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "stripe_subscription_id" });
      if (error) throw error;
    },
    async findUserIdByCustomer(customerId) {
      const { data } = await db.from("stripe_customers").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
      return (data?.user_id as string | undefined) ?? null;
    },
    async onActivated() {
      // Server-side business event: no user id, email or amounts are stored.
      await db.from("analytics_events").insert({ event: "subscription_activated", props: {}, utm: {} });
    },
  };
}

export async function getUserSubscription(db: SupabaseClient, userId: string): Promise<SubscriptionRow | null> {
  const { data } = await db
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as SubscriptionRow | null) ?? null;
}

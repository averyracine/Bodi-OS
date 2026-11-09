import { isBillingConfigured, publicEnv } from "@/lib/env";
import { getStripe } from "@/lib/billing/stripe";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { isSameOrigin, json, notConfigured } from "@/lib/request";

/** Opens the Stripe Customer Portal (manage card, cancel). */
export async function POST() {
  if (!isBillingConfigured()) return notConfigured("Billing");
  if (!(await isSameOrigin())) return json({ error: "bad_origin" }, 403);
  const user = await getSessionUser();
  if (!user) return json({ error: "unauthenticated" }, 401);
  const admin = getAdminSupabase()!;
  const { data } = await admin.from("stripe_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!data) return json({ error: "no_customer" }, 404);
  const portal = await getStripe()!.billingPortal.sessions.create({
    customer: data.stripe_customer_id as string,
    return_url: `${publicEnv.appUrl}/app/settings`,
  });
  return json({ url: portal.url });
}

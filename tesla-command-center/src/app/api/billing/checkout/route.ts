import { cookies } from "next/headers";
import { isBillingConfigured, publicEnv } from "@/lib/env";
import { getStripe, resolvePrice } from "@/lib/billing/stripe";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/server";
import { sanitizeUtm } from "@/lib/analytics-schema";
import { isSameOrigin, json, notConfigured, userHasPremium } from "@/lib/request";

/** Creates a Stripe-hosted Checkout Session. We never see card details. */
export async function POST() {
  if (!isBillingConfigured()) return notConfigured("Billing");
  if (!(await isSameOrigin())) return json({ error: "bad_origin" }, 403);
  const user = await getSessionUser();
  if (!user) return json({ error: "unauthenticated" }, 401);
  if (await userHasPremium(user.id)) return json({ error: "already_subscribed" }, 409);

  const stripe = getStripe()!;
  const admin = getAdminSupabase()!;

  let price;
  try {
    price = await resolvePrice(stripe);
  } catch (err) {
    console.error("[billing] price resolution failed", (err as Error).message);
    return json({ error: "price_unavailable" }, 500);
  }

  // Reuse or create the Stripe customer mapped to this user.
  const { data: existing } = await admin.from("stripe_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  let customerId = existing?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create(
      { email: user.email ?? undefined, metadata: { user_id: user.id } },
      { idempotencyKey: `customer-${user.id}` },
    );
    customerId = customer.id;
    const { error } = await admin.from("stripe_customers").insert({ user_id: user.id, stripe_customer_id: customerId });
    if (error && error.code !== "23505") return json({ error: "customer_failed" }, 500);
    if (error) {
      const { data } = await admin.from("stripe_customers").select("stripe_customer_id").eq("user_id", user.id).single();
      customerId = data!.stripe_customer_id as string;
    }
  }

  let utm = {};
  try {
    const raw = (await cookies()).get("tcc_utm")?.value;
    utm = raw ? sanitizeUtm(JSON.parse(decodeURIComponent(raw))) : {};
  } catch {
    utm = {};
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: price.id, quantity: 1 }],
    subscription_data: { metadata: { user_id: user.id, ...utm } },
    metadata: { user_id: user.id, ...utm },
    allow_promotion_codes: false,
    // The success page only *checks* status; access comes from the webhook.
    success_url: `${publicEnv.appUrl}/app/settings?checkout=returned`,
    cancel_url: `${publicEnv.appUrl}/app/settings?checkout=canceled`,
  });
  return json({ url: session.url });
}

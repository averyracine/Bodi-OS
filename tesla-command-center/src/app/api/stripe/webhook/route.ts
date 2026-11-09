import type Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { processStripeEvent } from "@/lib/billing/reconcile";
import { supabaseBillingStore } from "@/lib/billing/supabase-store";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { json, notConfigured } from "@/lib/request";

export async function POST(req: Request) {
  const stripe = getStripe();
  const admin = getAdminSupabase();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !admin || !secret) return notConfigured("Stripe webhooks");

  const signature = req.headers.get("stripe-signature");
  if (!signature) return json({ error: "missing_signature" }, 400);
  const payload = await req.text(); // raw body is required for signature verification

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch {
    return json({ error: "invalid_signature" }, 400);
  }

  try {
    const outcome = await processStripeEvent(event, supabaseBillingStore(admin), {
      async retrieve(id) {
        try {
          return await stripe.subscriptions.retrieve(id);
        } catch (err) {
          if ((err as { code?: string }).code === "resource_missing") return null;
          throw err;
        }
      },
    });
    return json({ received: true, outcome: outcome.result });
  } catch (err) {
    console.error("[stripe-webhook] processing failed", event.id, (err as Error).message);
    return json({ error: "processing_failed" }, 500); // Stripe will retry
  }
}

import "server-only";
import Stripe from "stripe";
import { assertExpectedPrice } from "./reconcile";

let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (process.env.NODE_ENV !== "production" && key.startsWith("sk_live_")) {
    throw new Error("Refusing to use a live Stripe key outside production");
  }
  stripe ??= new Stripe(key, { appInfo: { name: "CruiseCtrl" } });
  return stripe;
}

/** Resolves and validates the $10/month price on the server. Never trusts the client. */
export async function resolvePrice(s: Stripe): Promise<Stripe.Price> {
  let price: Stripe.Price | undefined;
  if (process.env.STRIPE_PRICE_LOOKUP_KEY) {
    const list = await s.prices.list({ lookup_keys: [process.env.STRIPE_PRICE_LOOKUP_KEY], active: true, limit: 1 });
    price = list.data[0];
  } else if (process.env.STRIPE_PRICE_ID) {
    price = await s.prices.retrieve(process.env.STRIPE_PRICE_ID);
  }
  if (!price) throw new Error("Stripe price not found");
  assertExpectedPrice(price);
  return price;
}

import type Stripe from "stripe";

/**
 * Stripe → database reconciliation.
 *
 * Rules:
 * - Every event is verified before it reaches this module (see the webhook route).
 * - Duplicate deliveries are detected by event id and acknowledged without side effects.
 * - Out-of-order deliveries are harmless: for any subscription-related event we
 *   re-fetch the *current* subscription from Stripe and store that, never the
 *   (possibly stale) event payload. If the subscription can no longer be fetched we
 *   fall back to the payload only when it is newer than what we already applied.
 * - Access is derived from the stored row on the server; the checkout success URL
 *   and the browser never grant anything.
 */

export interface SubscriptionRow {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  /** Unix seconds of the newest Stripe event applied to this row. */
  last_event_created: number;
}

export interface BillingStore {
  /** Insert the event id; return false if it was already recorded. */
  recordEvent(eventId: string, type: string): Promise<boolean>;
  /** Remove a recorded event so Stripe's retry can reprocess it after a failure. */
  forgetEvent(eventId: string): Promise<void>;
  getSubscription(subscriptionId: string): Promise<SubscriptionRow | null>;
  upsertSubscription(row: SubscriptionRow): Promise<void>;
  findUserIdByCustomer(customerId: string): Promise<string | null>;
  onActivated?(row: SubscriptionRow): Promise<void>;
}

export interface SubscriptionFetcher {
  /** Returns null when Stripe reports the subscription no longer exists. */
  retrieve(subscriptionId: string): Promise<Stripe.Subscription | null>;
}

const PREMIUM_STATUSES = new Set(["active", "trialing"]);

export function hasPremiumAccess(row: Pick<SubscriptionRow, "status" | "current_period_end"> | null, now = Date.now()): boolean {
  if (!row || !PREMIUM_STATUSES.has(row.status)) return false;
  if (!row.current_period_end) return true;
  // Small grace window covers webhook latency at renewal time.
  return Date.parse(row.current_period_end) + 6 * 60 * 60 * 1000 > now;
}

const idOf = (v: string | { id: string } | null | undefined): string | null =>
  typeof v === "string" ? v : v && typeof v.id === "string" ? v.id : null;

export function subscriptionIdFromEvent(event: Stripe.Event): string | null {
  const obj = event.data.object as unknown as Record<string, unknown>;
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const s = obj as unknown as Stripe.Checkout.Session;
      return s.mode === "subscription" ? idOf(s.subscription as string | { id: string } | null) : null;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      return typeof obj.id === "string" ? obj.id : null;
    case "invoice.paid":
    case "invoice.payment_failed": {
      const inv = obj as unknown as Stripe.Invoice;
      return idOf(inv.parent?.subscription_details?.subscription as string | { id: string } | null | undefined);
    }
    default:
      return null;
  }
}

function toRow(sub: Stripe.Subscription, userId: string, eventCreated: number, prev: SubscriptionRow | null): SubscriptionRow {
  const item = sub.items?.data?.[0];
  const periodEnd = item?.current_period_end ?? null;
  return {
    user_id: userId,
    stripe_customer_id: idOf(sub.customer as string | { id: string }) ?? "",
    stripe_subscription_id: sub.id,
    status: sub.status,
    price_id: item?.price?.id ?? null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    last_event_created: Math.max(eventCreated, prev?.last_event_created ?? 0),
  };
}

export type ProcessOutcome =
  | { result: "duplicate" }
  | { result: "ignored"; reason: string }
  | { result: "stale" }
  | { result: "applied"; status: string; activated: boolean };

export async function processStripeEvent(
  event: Stripe.Event,
  store: BillingStore,
  fetcher: SubscriptionFetcher,
): Promise<ProcessOutcome> {
  const fresh = await store.recordEvent(event.id, event.type);
  if (!fresh) return { result: "duplicate" };

  try {
    const subId = subscriptionIdFromEvent(event);
    if (!subId) return { result: "ignored", reason: "unhandled_event_type" };

    const prev = await store.getSubscription(subId);
    let sub = await fetcher.retrieve(subId);
    if (!sub) {
      // Fallback: only trust the payload when it is a subscription object newer than what we have.
      const payload = event.data.object as unknown as Stripe.Subscription;
      if (payload?.object !== "subscription") return { result: "ignored", reason: "subscription_missing" };
      if (prev && prev.last_event_created > event.created) return { result: "stale" };
      sub = payload;
    }

    const customerId = idOf(sub.customer as string | { id: string });
    const userId =
      (typeof sub.metadata?.user_id === "string" && sub.metadata.user_id) ||
      prev?.user_id ||
      (customerId ? await store.findUserIdByCustomer(customerId) : null);
    if (!userId) return { result: "ignored", reason: "unknown_customer" };

    const row = toRow(sub, userId, event.created, prev);
    await store.upsertSubscription(row);

    const activated = hasPremiumAccess(row) && !hasPremiumAccess(prev);
    if (activated && store.onActivated) await store.onActivated(row);
    return { result: "applied", status: row.status, activated };
  } catch (err) {
    await store.forgetEvent(event.id);
    throw err;
  }
}

/** Server-side price guard: refuse to sell anything other than the $10/month plan. */
export function assertExpectedPrice(price: Pick<Stripe.Price, "unit_amount" | "currency" | "recurring" | "active">): void {
  if (!price.active) throw new Error("Configured Stripe price is inactive");
  if (price.unit_amount !== 1000 || price.currency !== "usd") throw new Error("Configured Stripe price must be USD 10.00");
  if (price.recurring?.interval !== "month" || price.recurring.interval_count !== 1) {
    throw new Error("Configured Stripe price must bill monthly");
  }
}

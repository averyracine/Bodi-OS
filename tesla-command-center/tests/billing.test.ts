import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { MemoryBillingStore } from "@/lib/billing/memory-store";
import { assertExpectedPrice, hasPremiumAccess, processStripeEvent, type SubscriptionFetcher } from "@/lib/billing/reconcile";

const NOW_S = Math.floor(Date.now() / 1000);

function sub(status: string, extra: Partial<Record<string, unknown>> = {}): Stripe.Subscription {
  return {
    id: "sub_1",
    object: "subscription",
    customer: "cus_1",
    status,
    cancel_at_period_end: false,
    metadata: { user_id: "user-1" },
    items: { data: [{ current_period_end: NOW_S + 30 * 86400, price: { id: "price_1" } }] },
    ...extra,
  } as unknown as Stripe.Subscription;
}

function event(id: string, type: string, object: unknown, created = NOW_S): Stripe.Event {
  return { id, type, created, data: { object } } as unknown as Stripe.Event;
}

const fetcherOf = (current: Stripe.Subscription | null): SubscriptionFetcher => ({ retrieve: async () => current });

describe("stripe webhook reconciliation", () => {
  it("activates on a subscription event and records activation once", async () => {
    const store = new MemoryBillingStore();
    const out = await processStripeEvent(event("evt_1", "customer.subscription.created", sub("active")), store, fetcherOf(sub("active")));
    expect(out).toEqual({ result: "applied", status: "active", activated: true });
    expect(hasPremiumAccess(store.subs.get("sub_1")!)).toBe(true);
    expect(store.activations).toHaveLength(1);
  });

  it("ignores duplicate deliveries of the same event", async () => {
    const store = new MemoryBillingStore();
    const e = event("evt_1", "customer.subscription.updated", sub("active"));
    await processStripeEvent(e, store, fetcherOf(sub("active")));
    const again = await processStripeEvent(e, store, fetcherOf(sub("active")));
    expect(again).toEqual({ result: "duplicate" });
    expect(store.writes).toBe(1);
    expect(store.activations).toHaveLength(1);
  });

  it("handles out-of-order events by reconciling with Stripe's current state", async () => {
    const store = new MemoryBillingStore();
    // Stripe now says canceled. A late, stale "active" update arrives after the deletion.
    const current = sub("canceled");
    await processStripeEvent(event("evt_del", "customer.subscription.deleted", current, NOW_S + 10), store, fetcherOf(current));
    await processStripeEvent(event("evt_old", "customer.subscription.updated", sub("active"), NOW_S), store, fetcherOf(current));
    const row = store.subs.get("sub_1")!;
    expect(row.status).toBe("canceled");
    expect(row.last_event_created).toBe(NOW_S + 10);
    expect(hasPremiumAccess(row)).toBe(false);
  });

  it("refuses stale payloads when Stripe can no longer return the subscription", async () => {
    const store = new MemoryBillingStore();
    await processStripeEvent(event("evt_new", "customer.subscription.deleted", sub("canceled"), NOW_S + 10), store, fetcherOf(null));
    const out = await processStripeEvent(event("evt_old", "customer.subscription.updated", sub("active"), NOW_S), store, fetcherOf(null));
    expect(out).toEqual({ result: "stale" });
    expect(store.subs.get("sub_1")!.status).toBe("canceled");
  });

  it("checkout.session.completed fetches the subscription instead of trusting the session", async () => {
    const store = new MemoryBillingStore();
    const session = { object: "checkout.session", mode: "subscription", subscription: "sub_1" };
    const out = await processStripeEvent(event("evt_cs", "checkout.session.completed", session), store, fetcherOf(sub("incomplete")));
    expect(out).toMatchObject({ result: "applied", status: "incomplete", activated: false });
    expect(hasPremiumAccess(store.subs.get("sub_1")!)).toBe(false);
  });

  it("falls back to the customer mapping when metadata is missing", async () => {
    const store = new MemoryBillingStore();
    store.customers.set("cus_1", "user-9");
    const s = sub("active", { metadata: {} });
    await processStripeEvent(event("evt_1", "invoice.paid", { parent: { subscription_details: { subscription: "sub_1" } } }), store, fetcherOf(s));
    expect(store.subs.get("sub_1")!.user_id).toBe("user-9");
  });

  it("forgets the event when processing fails so Stripe's retry is processed", async () => {
    const store = new MemoryBillingStore();
    const failing: SubscriptionFetcher = { retrieve: async () => { throw new Error("stripe down"); } };
    const e = event("evt_1", "customer.subscription.updated", sub("active"));
    await expect(processStripeEvent(e, store, failing)).rejects.toThrow();
    expect(store.events.has("evt_1")).toBe(false);
    expect((await processStripeEvent(e, store, fetcherOf(sub("active")))).result).toBe("applied");
  });

  it("ignores unrelated events", async () => {
    const store = new MemoryBillingStore();
    expect(await processStripeEvent(event("evt_x", "customer.created", {}), store, fetcherOf(null))).toEqual({ result: "ignored", reason: "unhandled_event_type" });
  });
});

describe("access control", () => {
  it("only active/trialing within period grant premium", () => {
    const future = new Date(Date.now() + 86400_000).toISOString();
    const past = new Date(Date.now() - 2 * 86400_000).toISOString();
    expect(hasPremiumAccess(null)).toBe(false);
    expect(hasPremiumAccess({ status: "active", current_period_end: future })).toBe(true);
    expect(hasPremiumAccess({ status: "trialing", current_period_end: future })).toBe(true);
    expect(hasPremiumAccess({ status: "past_due", current_period_end: future })).toBe(false);
    expect(hasPremiumAccess({ status: "canceled", current_period_end: future })).toBe(false);
    expect(hasPremiumAccess({ status: "incomplete", current_period_end: future })).toBe(false);
    expect(hasPremiumAccess({ status: "active", current_period_end: past })).toBe(false);
  });

  it("price guard accepts only USD 10/month", () => {
    const ok = { active: true, unit_amount: 1000, currency: "usd", recurring: { interval: "month", interval_count: 1 } } as unknown as Stripe.Price;
    expect(() => assertExpectedPrice(ok)).not.toThrow();
    expect(() => assertExpectedPrice({ ...ok, unit_amount: 100 })).toThrow();
    expect(() => assertExpectedPrice({ ...ok, recurring: { ...ok.recurring!, interval: "year" } } as Stripe.Price)).toThrow();
  });
});

import type { BillingStore, SubscriptionRow } from "./reconcile";

/** In-memory billing store for unit tests. */
export class MemoryBillingStore implements BillingStore {
  events = new Map<string, string>();
  subs = new Map<string, SubscriptionRow>();
  customers = new Map<string, string>();
  activations: SubscriptionRow[] = [];
  writes = 0;

  async recordEvent(id: string, type: string) {
    if (this.events.has(id)) return false;
    this.events.set(id, type);
    return true;
  }
  async forgetEvent(id: string) {
    this.events.delete(id);
  }
  async getSubscription(id: string) {
    const r = this.subs.get(id);
    return r ? { ...r } : null;
  }
  async upsertSubscription(row: SubscriptionRow) {
    this.writes++;
    this.subs.set(row.stripe_subscription_id, { ...row });
  }
  async findUserIdByCustomer(customerId: string) {
    return this.customers.get(customerId) ?? null;
  }
  async onActivated(row: SubscriptionRow) {
    this.activations.push(row);
  }
}

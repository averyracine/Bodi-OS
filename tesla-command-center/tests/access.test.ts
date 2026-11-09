import { describe, expect, it } from "vitest";
import { decideAccess } from "@/lib/access-rules";

const future = new Date(Date.now() + 86400_000).toISOString();

describe("dashboard access", () => {
  it("normal account without subscription or entitlement is denied", () => {
    expect(decideAccess(null, null)).toEqual({ allowed: false, via: null });
  });
  it("active subscription grants access", () => {
    expect(decideAccess({ status: "active", current_period_end: future }, null)).toEqual({ allowed: true, via: "subscription" });
  });
  it("owner entitlement grants access without any subscription", () => {
    expect(decideAccess(null, { kind: "owner_test", revoked_at: null })).toEqual({ allowed: true, via: "owner" });
  });
  it("revoked entitlement no longer grants access", () => {
    expect(decideAccess(null, { kind: "owner_test", revoked_at: new Date().toISOString() })).toEqual({ allowed: false, via: null });
  });
  it("canceled subscription plus no entitlement is denied", () => {
    expect(decideAccess({ status: "canceled", current_period_end: future }, null).allowed).toBe(false);
  });
  it("unknown entitlement kinds are ignored", () => {
    expect(decideAccess(null, { kind: "free_forever", revoked_at: null }).allowed).toBe(false);
  });
});

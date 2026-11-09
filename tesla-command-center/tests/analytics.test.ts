import { describe, expect, it } from "vitest";
import { sanitizeProps, sanitizeUtm } from "@/lib/analytics-schema";

describe("analytics sanitization", () => {
  it("drops non-allowlisted props such as notes and codes", () => {
    expect(sanitizeProps({ preset: "watch", note: "my secret", code: "ABCD-EFGH", email: "a@b.c" })).toEqual({ preset: "watch" });
  });
  it("reports custom links only as 'custom'", () => {
    expect(sanitizeProps({ service_id: "custom-a1b2c3" })).toEqual({ service_id: "custom" });
  });
  it("rejects free-text UTM values", () => {
    expect(sanitizeUtm({ utm_source: "tiktok", utm_campaign: "john@example.com", utm_term: "has spaces" })).toEqual({ utm_source: "tiktok" });
  });
});

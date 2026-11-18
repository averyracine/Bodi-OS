import { test } from "node:test";
import assert from "node:assert/strict";
import { nextBusinessDay, todayInPhoenix } from "../src/lib/dates";
import { calculate, projectPricing, customEstimateText, startingPriceDisclaimer, calculatorDisclaimer } from "../src/content/pricing";
import { normalizePhone } from "../src/lib/format";
import { isLikelyServiceAreaZip } from "../src/lib/lead-input";

test("next business day uses Phoenix time and skips weekends", () => {
  // Fri 2026-11-20 10:00 Phoenix (17:00Z) -> Mon 11-23
  assert.equal(nextBusinessDay(new Date("2026-11-20T17:00:00Z")), "2026-11-23");
  // Sat -> Mon, Sun -> Mon
  assert.equal(nextBusinessDay(new Date("2026-11-21T17:00:00Z")), "2026-11-23");
  assert.equal(nextBusinessDay(new Date("2026-11-22T17:00:00Z")), "2026-11-23");
  // Mon 6 PM Phoenix is already Tue in UTC; must still be Tue (next day after Mon)
  assert.equal(todayInPhoenix(new Date("2026-11-17T01:00:00Z")), "2026-11-16");
  assert.equal(nextBusinessDay(new Date("2026-11-17T01:00:00Z")), "2026-11-17");
});

test("calculator never invents ceilings", () => {
  const k = calculate("kitchen", "premium")!;
  assert.deepEqual({ kind: k.kind, low: k.low, high: k.high }, { kind: "tailored", low: null, high: null });
  assert.equal(k.detail, customEstimateText);
  const b = calculate("bathroom", "essential")!;
  assert.equal(b.low, 7500);
  assert.equal(b.headline, "Starting at $7,500");
  const wh = calculate("wholeHome", "luxury")!;
  assert.equal(wh.kind, "range");
  assert.equal(wh.high, 500000);
  assert.equal(calculate("customHome", "luxury")!.kind, "tailored");
  assert.equal(calculate("nope", "luxury"), null);
});

test("price labels read exactly as the owner approved", () => {
  const label = Object.fromEntries(projectPricing.map((p) => [p.key, p.priceLabel]));
  assert.deepEqual(label, {
    kitchen: "Custom Project Estimates",
    bathroom: "Starting at $7,500",
    wholeHome: "$50,000–$500,000, depending on scope",
    addition: "Starting at $50,000",
    adu: "Starting at $75,000",
    customHome: "Individually Quoted",
    outdoor: "Custom Project Estimates",
    commercial: "Custom Commercial Proposals",
  });
  for (const p of projectPricing) {
    if (p.tailored) assert.equal(p.startingAt, null, `${p.key} must not have a starting price`);
  }
  assert.ok(calculatorDisclaimer.includes(startingPriceDisclaimer));
});

test("phone normalization and service-area ZIPs", () => {
  assert.equal(normalizePhone("(602) 743-6957"), "+16027436957");
  assert.equal(normalizePhone("1-602-743-6957"), "+16027436957");
  assert.equal(isLikelyServiceAreaZip("85016"), true);
  assert.equal(isLikelyServiceAreaZip("90210"), false);
});

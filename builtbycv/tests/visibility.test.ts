// Runs in its own process with the placeholder switch unset, which is how the live site runs.
delete process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS;

import { test } from "node:test";
import assert from "node:assert/strict";

test("on the live site, unconfirmed entries and projects without photos are hidden", async () => {
  const { visibleProjects, visiblePhotos, projects } = await import("../src/content/projects");
  const { visibleBeforeAfter } = await import("../src/content/copy");
  const slugs = visibleProjects().map((p) => p.slug);
  assert.ok(!slugs.includes("kitchen-remodel-east-valley"), "unconfirmed East Valley entry must be hidden");
  const bySlug = (s: string) => projects.find((p) => p.slug === s)!;
  assert.deepEqual(slugs, ["mulberry-luxury-renovation", "wickieup-residence-505", "cave-creek-kitchen-transformation"]);
  for (const s of slugs) assert.ok(visiblePhotos(bySlug(s)).length > 0, `${s} must have a photo`);
  assert.equal(visiblePhotos(bySlug("kitchen-remodel-east-valley")).length, 0);
  const pairs = visibleBeforeAfter();
  assert.ok(!pairs.some((b) => b.projectSlug === "kitchen-remodel-east-valley"), "East Valley pair stays hidden");
  const { showPlaceholders } = await import("../src/content/site");
  assert.equal(showPlaceholders, false, "placeholder tags are off unless switched on");
});

test("every project photo is labelled and no location includes a street or number", async () => {
  const { projects } = await import("../src/content/projects");
  for (const p of projects) {
    assert.ok(!/\d/.test(p.city) && !/\b(Dr|Drive|Ln|Lane|St|Street|Rd|Road|Ave)\b/.test(`${p.city} ${p.area ?? ""}`), `${p.slug} location must be city/area level`);
    for (const ph of p.photos) {
      assert.ok(ph.alt.length > 20 && ph.caption.length > 3, `${ph.src} needs alt text and a caption`);
      assert.ok(ph.width > 0 && ph.height > 0 && Math.max(ph.width, ph.height) <= 2000, `${ph.src} size`);
    }
  }
  const cc = projects.find((p) => p.slug === "cave-creek-kitchen-transformation")!;
  assert.equal(cc.photos[0].src.endsWith("kitchen-after-2.jpg"), true, "kitchen after is the lead image");
  assert.equal(cc.photos[0].room, "Kitchen");
  const mulberry = projects.find((p) => p.slug === "mulberry-luxury-renovation")!;
  assert.equal(mulberry.status, "in-development");
  assert.deepEqual(mulberry.photos.map((ph) => ph.kind), ["rendering", "rendering", "plans"]);
});

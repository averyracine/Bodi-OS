// Runs in its own process, so the placeholder switch can be set before the content loads.
process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS = "false";

import { test } from "node:test";
import assert from "node:assert/strict";

test("at launch, unconfirmed photos and entries are hidden", async () => {
  const { visibleProjects, visiblePhotos, projects } = await import("../src/content/projects");
  const { visibleBeforeAfter } = await import("../src/content/copy");
  const slugs = visibleProjects().map((p) => p.slug);
  assert.ok(!slugs.includes("kitchen-remodel-east-valley"), "unconfirmed East Valley entry must be hidden");
  const bySlug = (s: string) => projects.find((p) => p.slug === s)!;
  assert.equal(visiblePhotos(bySlug("wickieup-residence-505")).length, 0);
  assert.equal(visiblePhotos(bySlug("cave-creek-kitchen-transformation")).length, 0);
  assert.equal(visiblePhotos(bySlug("mulberry-luxury-renovation")).length, 3, "confirmed Mulberry renderings and plans stay");
  const pairs = visibleBeforeAfter();
  assert.deepEqual(pairs.map((b) => b.projectSlug), [null], "only the unlinked kitchen pair remains");
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
  const mulberry = projects.find((p) => p.slug === "mulberry-luxury-renovation")!;
  assert.equal(mulberry.status, "in-development");
  assert.deepEqual(mulberry.photos.map((ph) => ph.kind), ["rendering", "rendering", "plans"]);
});

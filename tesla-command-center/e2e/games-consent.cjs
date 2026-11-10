/**
 * Games row, GTA VI tile, "How to play" sheet and consent-banner/dock checks
 * against a running server (demo mode) at 390x844, 1280x800 and 1920x1200.
 *   BASE_URL=http://localhost:3000 node e2e/games-consent.cjs
 * xbox.com is never contacted: the tile's navigation is answered with a stub.
 * Optional SHOTS_DIR=... saves screenshots.
 */
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR;
// Expected without FINNHUB_API_KEY: /api/quotes answers 503 and the ticker shows sample data.
const EXPECTED_ERROR = /status of 503 .* @ .*\/api\/quotes\?/;
let fails = 0;
const check = (n, ok, d = "") => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? "  (" + d + ")" : ""}`); };

async function dockHits(page) {
  // Every visible dock control is the topmost element at its own centre (nothing covers it).
  return page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('nav[aria-label="Primary"] a, nav[aria-label="Primary"] button')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(el).display === "none") continue;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      out.push({ label: el.textContent.trim(), ok: !!hit && el.contains(hit) });
    }
    return out;
  });
}
const overlap = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);

(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of [[390, 844], [1280, 800], [1920, 1200]]) {
    const tag = `@${w}x${h}`;
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    // Never hit xbox.com for real: answer the navigation with a stub page.
    await ctx.route(/https:\/\/(www\.)?xbox\.com\/.*/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>xbox stub" }));
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text() + " @ " + (m.location().url || "")));
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto(`${BASE}/app`);
    await page.getByRole("list", { name: "Watch favorites" }).waitFor();
    const banner = page.getByRole("region", { name: "Analytics consent" });
    check(`banner showing ${tag}`, await banner.isVisible());
    const bb = await banner.boundingBox();
    const db = await page.locator('nav[aria-label="Primary"]').boundingBox();
    check(`banner does not overlap dock ${tag}`, !overlap({ left: bb.x, right: bb.x + bb.width, top: bb.y, bottom: bb.y + bb.height }, { left: db.x, right: db.x + db.width, top: db.y, bottom: db.y + db.height }), `banner bottom ${Math.round(bb.y + bb.height)} dock top ${Math.round(db.y)}`);
    const hits = await dockHits(page);
    check(`every dock control reachable with banner ${tag}`, hits.length >= 4 && hits.every((x) => x.ok), hits.map((x) => `${x.label}:${x.ok}`).join(" "));
    check(`no horizontal scroll home ${tag}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/home-banner-${w}x${h}.png` });

    // Games row + GTA tile
    const games = page.getByRole("list", { name: "Games" });
    check(`games row visible ${tag}`, await games.isVisible());
    const gta = games.getByRole("link", { name: /GTA VI on Xbox Cloud Gaming/ });
    check(`gta tile href ${tag}`, (await gta.getAttribute("href")) === "https://www.xbox.com/play");
    check(`gta tile same tab ${tag}`, (await gta.getAttribute("target")) === null);
    check(`gta tile has no images ${tag}`, (await games.locator("li").first().locator("img").count()) === 0);
    await page.getByRole("button", { name: "How to play: GTA VI on Xbox Cloud Gaming" }).first().click();
    const dlg = page.getByRole("dialog", { name: "How to play" });
    check(`guide sheet opens ${tag}`, await dlg.isVisible());
    check(`guide sheet is topmost ${tag}`, await page.evaluate(() => { const d = document.querySelector('[role="dialog"]'); const r = d.getBoundingClientRect(); return [[0.5, 0.2], [0.5, 0.5], [0.5, 0.9]].every(([x, y]) => d.contains(document.elementFromPoint(r.left + r.width * x, r.top + r.height * y))); }));
    check(`guide says unverified ${tag}`, await dlg.getByText("Unverified on current Tesla software").isVisible());
    check(`no horizontal scroll with sheet ${tag}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/guide-${w}x${h}.png` });
    await page.keyboard.press("Escape");
    check(`guide sheet closes on Escape ${tag}`, !(await dlg.isVisible()));

    // Library: Games filter
    await page.goto(`${BASE}/app/library`);
    await page.getByRole("tab", { name: /Games/ }).click();
    const cards = page.locator("ul li.card");
    check(`library games filter shows 3 ${tag}`, (await cards.count()) === 3, String(await cards.count()));
    check(`library gta first + not-tested label ${tag}`, (await cards.first().textContent()).includes("GTA VI on Xbox Cloud Gaming") && (await cards.first().textContent()).includes("Not yet tested on Tesla") && (await cards.first().textContent()).includes("Launches Nov 19, 2026. Requires Xbox Game Pass and a controller."));
    check(`no horizontal scroll library ${tag}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const hits2 = await dockHits(page);
    check(`dock reachable on library with banner ${tag}`, hits2.every((x) => x.ok), hits2.map((x) => `${x.label}:${x.ok}`).join(" "));
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/library-games-${w}x${h}.png` });

    // Dock navigation with the banner still up (phone: Settings via More).
    if (w < 640) {
      await page.getByRole("button", { name: "More" }).click();
      const more = await page.evaluate(() => [...document.querySelectorAll("#dock-more a")].map((a) => { const r = a.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return a.contains(hit); }));
      check(`More menu items reachable with banner ${tag}`, more.length === 2 && more.every(Boolean));
      await page.locator("#dock-more").getByRole("link", { name: "Settings" }).click();
    } else {
      await page.locator('nav[aria-label="Primary"]').getByRole("link", { name: "Settings" }).click();
    }
    await page.waitForURL(/\/app\/settings/);
    check(`dock Settings navigates with banner up ${tag}`, (await banner.isVisible()) && page.url().includes("/app/settings"));
    await page.locator('nav[aria-label="Primary"]').getByRole("link", { name: "Focus" }).click();
    await page.waitForURL(/\/app\/focus/);
    check(`dock Focus navigates ${tag}`, true);

    // GTA tile navigates the same tab to xbox.com/play
    await page.goto(`${BASE}/app`);
    await page.getByRole("list", { name: "Games" }).waitFor();
    const pages0 = ctx.pages().length;
    await Promise.all([page.waitForURL("https://www.xbox.com/play"), page.getByRole("list", { name: "Games" }).getByRole("link", { name: /GTA VI/ }).click()]);
    check(`GTA tile navigates same tab to xbox.com/play ${tag}`, page.url() === "https://www.xbox.com/play" && ctx.pages().length === pages0, page.url());

    const unexpected = errors.filter((e) => !EXPECTED_ERROR.test(e));
    check(`no console errors ${tag}`, unexpected.length === 0, unexpected.join(" | ").slice(0, 400));
    await ctx.close();
  }
  await browser.close();
  console.log(fails ? `${fails} FAILED` : "ALL PASSED");
  process.exit(fails ? 1 : 0);
})();

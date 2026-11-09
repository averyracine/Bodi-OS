/**
 * Browser smoke checks against a running server (demo mode).
 *   BASE_URL=http://localhost:3000 node e2e/smoke.cjs
 * Uses the system Playwright. Screenshots go to docs/screenshots/.
 */
const { chromium } = require("playwright");
const path = require("node:path");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = path.join(__dirname, "..", "docs", "screenshots");
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

const visible = (loc) => loc.first().waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false);

async function noHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}

(async () => {
  const browser = await chromium.launch();

  // ---------- Landscape development viewports ----------
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);
    await page.getByRole("button", { name: "No thanks" }).click();
    await page.getByRole("region", { name: "Interactive dashboard preview" }).getByRole("list", { name: "Watch favorites" }).waitFor();
    check(`landing headline @${w}x${h}`, await visible(page.getByRole("heading", { name: "Your parked time. Upgraded." })));
    check(`landing no horizontal scroll @${w}x${h}`, await noHorizontalScroll(page));
    await page.screenshot({ path: `${SHOTS}/landing-${w}x${h}.png` });

    await page.goto(`${BASE}/app`);
    await page.getByRole("list", { name: "Watch favorites" }).waitFor();
    check(`dashboard no horizontal scroll @${w}x${h}`, await noHorizontalScroll(page));
    await page.getByRole("button", { name: "No thanks" }).click().catch(() => {});
    await page.screenshot({ path: `${SHOTS}/app-home-${w}x${h}.png` });
    // Ticker: every visible symbol fits; overflow wraps to a hidden line instead of clipping.
    const tickerOk = await page.evaluate(() => {
      const row = document.querySelector('[aria-label="Quotes"]');
      if (!row) return false;
      const r = row.getBoundingClientRect();
      const items = [...row.querySelectorAll("[data-ticker-item]")];
      const firstTop = items[0].getBoundingClientRect().top;
      return items.filter((i) => i.getBoundingClientRect().top === firstTop).every((i) => i.getBoundingClientRect().right <= r.right + 0.5);
    });
    check(`ticker has no clipped symbols @${w}x${h}`, tickerOk);
    // Dock never covers content: at the bottom of the page, main's last element ends above the dock.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const dockClear = await page.evaluate(() => {
      const dock = document.querySelector('nav[aria-label="Primary"]').getBoundingClientRect();
      const main = document.querySelector("main");
      const last = [...main.querySelectorAll("*")].reduce((m, el) => Math.max(m, el.getBoundingClientRect().bottom), 0);
      return last <= dock.top + 1;
    });
    check(`dock does not cover content @${w}x${h}`, dockClear);
    await page.evaluate(() => window.scrollTo(0, 0));
    for (const v of ["library", "focus", "discover", "settings"]) {
      await page.goto(`${BASE}/app/${v}`);
      await page.locator("h1").first().waitFor();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SHOTS}/app-${v}-${w}x${h}.png` });
    }
    await ctx.close();
  }

  // ---------- Functional checks @1280x800 ----------
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // Icons must never come from the network: record any image or font request that leaves our origin.
  const externalAssets = [];
  page.on("request", (r) => {
    const t = r.resourceType();
    if ((t === "image" || t === "font") && !r.url().startsWith(BASE) && !r.url().startsWith("data:")) externalAssets.push(r.url());
  });
  const iconKinds = (scope) => scope.locator("[data-app-icon]").evaluateAll((els) =>
    els.map((e) => ({ kind: e.getAttribute("data-icon-kind"), ok: e.getAttribute("data-icon-kind") !== "brand" || (e.querySelector("img")?.naturalWidth ?? 0) > 0 })));

  await page.goto(`${BASE}/app`);
  await page.getByRole("list", { name: "Watch favorites" }).waitFor();
  const favList = page.getByRole("list", { name: "Watch favorites" });
  check("8 default Watch favorites", (await favList.locator("li").count()) === 8);
  await page.waitForFunction(() => [...document.querySelectorAll("[data-icon-kind=brand] img")].every((i) => i.complete));
  const favIcons = await iconKinds(favList);
  check("all Watch favorites show a rendered brand logo", favIcons.length === 8 && favIcons.every((i) => i.kind === "brand" && i.ok), JSON.stringify(favIcons));
  const qlIcons = await iconKinds(page.getByRole("list", { name: "Quick Launch apps" }));
  check("Quick Launch shows brand logos", qlIcons.length > 0 && qlIcons.every((i) => i.kind === "brand" && i.ok));
  check("markets card shows sample label", await visible(page.getByText("Sample data · not real prices")));
  check("ticker band renders", await visible(page.getByRole("region", { name: "Market ticker" })));

  // External link semantics
  const first = favList.locator("a").first();
  const href = await first.getAttribute("href");
  check("tile links to official https URL", href === "https://www.youtube.com/", href);
  check("tile opens new tab with noopener noreferrer", (await first.getAttribute("target")) === "_blank" && (await first.getAttribute("rel")) === "noopener noreferrer");

  // Reorder via Move buttons + persistence
  await page.getByRole("button", { name: "Arrange" }).click();
  await page.getByRole("button", { name: "Move YouTube later" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await page.reload();
  await page.getByRole("list", { name: "Watch favorites" }).waitFor();
  const firstHref = await page.getByRole("list", { name: "Watch favorites" }).locator("a").first().getAttribute("href");
  check("Move button reorder persists across reload", firstHref === "https://www.netflix.com/", firstHref);

  // Presets
  await page.getByRole("radio", { name: "Listen" }).click();
  await page.getByRole("list", { name: "Listen favorites" }).waitFor();
  await page.reload();
  check("active preset persists across reload", await page.getByRole("list", { name: "Listen favorites" }).waitFor({ timeout: 5000 }).then(() => true, () => false));
  check("Listen preset has its own favorites", (await page.getByRole("list", { name: "Listen favorites" }).locator("a").first().getAttribute("href")) === "https://open.spotify.com/");

  // Library: every catalog app shows its logo; only PlugShare (no published SVG) falls back.
  await page.goto(`${BASE}/app/library`);
  await page.getByRole("searchbox", { name: "Search apps" }).waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll("[data-icon-kind=brand] img")].every((i) => i.complete));
  const libIcons = await page.locator("main ul > li").evaluateAll((lis) => lis.map((li) => ({
    name: li.querySelector("p")?.textContent,
    kind: li.querySelector("[data-app-icon]")?.getAttribute("data-icon-kind"),
    ok: (li.querySelector("[data-app-icon] img")?.naturalWidth ?? 1) > 0,
  })));
  const fallbacks = libIcons.filter((i) => i.kind !== "brand").map((i) => i.name);
  check("library: 27 brand logos, PlugShare is the only fallback", libIcons.length === 28 && libIcons.every((i) => i.ok) && fallbacks.join() === "PlugShare", fallbacks.join());

  // Library search + favorite toggle
  await page.getByRole("searchbox", { name: "Search apps" }).fill("geforce");
  const cards = page.locator("main ul > li");
  check("search filters library", (await cards.count()) === 1 && (await cards.first().innerText()).includes("GeForce NOW"));
  check("catalog shows honest Tesla status", await cards.first().getByText("Not yet tested on Tesla").isVisible());
  await page.getByRole("button", { name: "Add GeForce NOW to Listen" }).click();
  check("favorite added", await visible(page.getByRole("button", { name: "Remove GeForce NOW from Listen" })));
  await page.getByRole("searchbox", { name: "Search apps" }).fill("zzzz");
  check("empty search state", await visible(page.getByText("No matches")));
  await page.getByRole("button", { name: "Clear search" }).click();

  // Category filter
  await page.getByRole("tab", { name: "Gaming" }).click();
  check("category filter", (await cards.count()) === 2);
  await page.getByRole("tab", { name: "All" }).click();

  // Custom links: reject dangerous, accept https
  await page.getByLabel("Link name").fill("Bad");
  await page.getByLabel("HTTPS address").fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Add link" }).click();
  const formAlert = page.locator("form [role=alert]");
  check("rejects javascript: link", (await formAlert.innerText()).includes("https://"), await formAlert.innerText());
  await page.getByLabel("HTTPS address").fill("data:text/html,hi");
  await page.getByRole("button", { name: "Add link" }).click();
  check("rejects data: link", await formAlert.isVisible());
  await page.getByLabel("Link name").fill("Charge map");
  await page.getByLabel("HTTPS address").fill("https://example.com/map");
  await page.getByRole("button", { name: "Add link" }).click();
  check("accepts https custom link", await visible(page.getByText("Charge map")));
  check("custom link uses the initials fallback", (await page.locator("main ul > li").filter({ hasText: "Charge map" }).locator("[data-icon-kind=fallback]").count()) === 1);

  // Launch behavior toggle
  await page.getByRole("searchbox", { name: "Search apps" }).fill("netflix");
  await page.getByRole("radiogroup", { name: "How Netflix opens" }).getByRole("radio", { name: "This tab" }).click();
  const openLink = page.locator("main ul > li").first().getByRole("link");
  check("per-service launch behavior applies", (await openLink.getAttribute("target")) === null);

  // Keyboard navigation: skip link, then dock
  await page.goto(`${BASE}/app`);
  await page.getByRole("list", { name: "Listen favorites" }).waitFor();
  await page.keyboard.press("Tab");
  check("skip link is first focus", (await page.evaluate(() => document.activeElement?.textContent)) === "Skip to content");
  let reached = false;
  for (let i = 0; i < 60 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = (await page.evaluate(() => document.activeElement?.getAttribute("href"))) === "/app/focus";
  }
  check("dock reachable by keyboard", reached);
  if (reached) {
    await page.keyboard.press("Enter");
    await page.waitForURL("**/app/focus");
    check("Enter on dock navigates", page.url().endsWith("/app/focus"));
  }

  // Focus timer
  await page.getByRole("button", { name: "Start" }).click();
  await page.waitForTimeout(1300);
  const t = await page.getByRole("timer").innerText();
  check("timer counts down", t !== "25:00", t);
  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("radio", { name: "Split view" }).click();
  check("split layout renders two panes", (await page.getByRole("region", { name: /pane/ }).count()) === 2);

  // Search icon alignment: icon sits inside the input's left padding, vertically centred.
  await page.goto(`${BASE}/app/library`);
  await page.getByRole("searchbox", { name: "Search apps" }).waitFor();
  const align = await page.evaluate(() => {
    const icon = document.querySelector("[data-search-icon] svg").getBoundingClientRect();
    const input = document.querySelector('input[type="search"]');
    const ir = input.getBoundingClientRect();
    const padLeft = parseFloat(getComputedStyle(input).paddingLeft);
    return icon.right <= ir.left + padLeft && Math.abs((icon.top + icon.bottom) / 2 - (ir.top + ir.bottom) / 2) < 2;
  });
  check("search icon aligned inside input", align);
  check("category chips show counts", /\d/.test(await page.getByRole("tab", { name: /Gaming/ }).innerText()));

  // Quick Launch target from the library
  await page.getByRole("radiogroup", { name: "Add apps to" }).getByRole("radio", { name: "Quick Launch" }).click();
  await page.getByRole("searchbox", { name: "Search apps" }).fill("perplexity");
  await page.getByRole("button", { name: "Add Perplexity to Quick Launch" }).click();
  await page.getByRole("searchbox", { name: "Search apps" }).fill("");

  // Recently opened uses the same icons (launch from Library recorded YouTube/Netflix earlier).
  await page.goto(`${BASE}/app`);
  await page.getByRole("list", { name: /favorites/ }).waitFor();
  await page.getByRole("list", { name: /favorites/ }).locator("a").first().evaluate((a) => a.addEventListener("click", (e) => e.preventDefault(), { once: true }));
  await page.getByRole("list", { name: /favorites/ }).locator("a").first().click();
  const recentIcons = await page.locator("h2:has-text('Recently opened')").locator("xpath=../..").locator("[data-app-icon]").evaluateAll((els) => els.map((e) => e.getAttribute("data-icon-kind")));
  check("recently opened shows brand logos", recentIcons.length > 0 && recentIcons.every((k) => k === "brand"), recentIcons.join());
  // Arrange mode: tiles stop being links, so rearranging can't launch an app.
  await page.getByRole("button", { name: "Arrange" }).click();
  check("arrange mode has no launch links in the grid", (await page.getByRole("list", { name: /favorites/ }).locator("a[target], a[href^='https://']").count()) === 0);
  check("arrange mode keeps brand logos", (await page.getByRole("list", { name: /favorites/ }).locator("[data-icon-kind=brand]").count()) > 0);
  await page.getByRole("button", { name: "Done" }).first().click();

  // Modes: Work and Drive, persistence
  await page.goto(`${BASE}/app`);
  await page.getByRole("radio", { name: "Drive" }).click();
  await page.getByRole("list", { name: "Drive favorites" }).waitFor();
  check("Drive mode shows its own apps", (await page.getByRole("list", { name: "Drive favorites" }).locator("a").first().getAttribute("href")) === "https://www.google.com/maps");
  check("Drive mode shows labelled sample weather", await visible(page.getByText("Sample weather · not live")));
  await page.reload();
  check("Drive mode persists across reload", await visible(page.getByRole("list", { name: "Drive favorites" })));
  await page.getByRole("radio", { name: "Work" }).click();
  check("switching modes leaves one apps heading", (await page.locator("#fav-heading").count()) === 1 && (await page.locator("#fav-heading").innerText()).trim() === "Work");
  check("Work mode icons are all brand logos", (await iconKinds(page.getByRole("list", { name: "Work favorites" }))).every((i) => i.kind === "brand"));
  check("Work mode shows AI apps", (await page.getByRole("list", { name: "Work favorites" }).locator("a").first().getAttribute("href")) === "https://chatgpt.com/");

  // Widgets: hide, move, resize, persist, restore, reset
  await page.getByRole("button", { name: "Customize widgets" }).click();
  await page.getByRole("button", { name: "Hide Markets" }).click();
  await page.getByRole("button", { name: "Move Quick Notes up" }).click();
  await page.getByRole("button", { name: "Expand Calendar" }).click();
  await page.getByRole("button", { name: "Done" }).last().click();
  await page.reload();
  await page.getByRole("list", { name: "Work favorites" }).waitFor();
  const order = await page.locator("[data-widget]").evaluateAll((els) => els.map((e) => e.getAttribute("data-widget")));
  check("widget hide/move persists", !order.includes("markets") && order.indexOf("notes") < order.indexOf("calendar"), order.join(","));
  check("widget size persists", await visible(page.getByRole("grid", { name: "This month" })));
  await page.getByRole("button", { name: "Customize widgets" }).click();
  await page.getByRole("button", { name: "Show Markets" }).click();
  check("hidden widget can be restored", (await page.locator('[data-widget="markets"]').count()) === 1);
  await page.getByRole("button", { name: "Reset this mode’s widgets" }).click();
  const reset = await page.locator("[data-widget]").evaluateAll((els) => els.map((e) => e.getAttribute("data-widget")).join(","));
  check("widget layout resets", reset === "clock,calendar,notes,markets", reset);
  await page.getByRole("button", { name: "Done" }).last().click();
  await page.getByRole("radio", { name: "Watch" }).click();
  check("Quick Launch shows chosen app", await visible(page.getByRole("list", { name: "Quick Launch apps" }).getByText("Perplexity")));
  await page.getByRole("radio", { name: "Listen" }).click();

  // Discover: apply a setup with in-page confirmation
  await page.goto(`${BASE}/app/discover`);
  await page.getByRole("button", { name: "Use for Drive mode" }).first().click();
  await page.getByRole("button", { name: "Replace" }).click();
  check("discover setup applies", await visible(page.getByText("Applied to Drive.")));

  // Watchlist editing
  await page.goto(`${BASE}/app/settings`);
  await page.getByPlaceholder("Add a symbol, e.g. RIVN").fill("rivn");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  check("adds watchlist symbol", await visible(page.getByRole("list", { name: "Watchlist" }).getByText("RIVN")));
  await page.getByPlaceholder("Add a symbol, e.g. RIVN").fill("not a ticker");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  check("rejects invalid symbol", await visible(page.locator("#markets [role=alert]")));

  // Settings: theme + export
  await page.goto(`${BASE}/app/settings`);
  await page.getByText("Midnight").click();
  check("theme applies", (await page.locator("[data-theme]").nth(1).getAttribute("data-theme")) === "midnight");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export" }).click()]);
  check("export downloads JSON", dl.suggestedFilename().endsWith(".json"));
  check("demo account state shown", await visible(page.getByText("Accounts aren’t set up in this build")));

  // Failure: session API down
  await page.route("**/api/session", (r) => r.abort());
  await page.reload();
  check("session failure shows retry", await visible(page.getByRole("button", { name: "Try again" })));
  await page.unroute("**/api/session");

  // Failure: offline
  await page.goto(`${BASE}/app`);
  await page.getByRole("list", { name: /favorites/ }).waitFor();
  await ctx.setOffline(true);
  await page.waitForTimeout(200);
  check("offline badge visible", await visible(page.getByRole("status").filter({ hasText: "Offline" })));
  await page.getByRole("list", { name: /favorites/ }).locator("a").first().click();
  check("offline launch warning", await visible(page.getByRole("alert").filter({ hasText: "appear to be offline" })));
  await page.screenshot({ path: `${SHOTS}/state-offline-1280x800.png` });
  await ctx.setOffline(false);

  // Pairing in demo mode
  await page.goto(`${BASE}/pair/car`);
  await page.getByRole("button", { name: "Show pairing code" }).click();
  check("pairing unavailable in demo is explained", await visible(page.getByText("isn't available in demo mode")));

  // Reset
  await page.goto(`${BASE}/app/settings`);
  await page.getByRole("button", { name: "Reset everything…" }).click();
  await page.getByRole("button", { name: "Yes, reset" }).click();
  await page.goto(`${BASE}/app`);
  check("reset restores defaults", await visible(page.getByRole("list", { name: "Watch favorites" })));

  // Migration: a saved v1 preferences object keeps its Focus (now Work) apps and gains Drive.
  await page.evaluate(() => localStorage.setItem("tcc.prefs.v1", JSON.stringify({
    version: 1, theme: "graphite", activePreset: "focus", presets: { watch: ["youtube"], listen: ["spotify"], focus: ["notion", "google-docs"] },
  })));
  await page.goto(`${BASE}/app`);
  check("v1 Focus apps migrate to Work", (await page.getByRole("list", { name: "Work favorites" }).locator("a").first().getAttribute("href")) === "https://www.notion.so/");
  await page.getByRole("radio", { name: "Drive" }).click();
  check("v1 data gains default Drive apps", (await page.getByRole("list", { name: "Drive favorites" }).locator("li").count()) === 6);

  // Brand: no leftover product names anywhere in the app.
  for (const path of ["/", "/app", "/app/library", "/app/focus", "/app/discover", "/app/settings", "/start", "/login", "/pair", "/pair/car"]) {
    await page.goto(`${BASE}${path}`);
    await page.locator("h1").first().waitFor();
    const txt = (await page.locator("body").innerText()) + " " + (await page.title());
    if (/Command Center|FSDash/i.test(txt)) check(`no old brand name on ${path}`, false, path);
  }
  check("CruiseCtrl title and wordmark present", /CruiseCtrl/.test(await page.title()) && (await page.getByRole("link", { name: "CruiseCtrl home" }).count()) > 0);

  check("no external image or font requests", externalAssets.length === 0, externalAssets.slice(0, 3).join(" "));
  check("no uncaught page errors", errors.length === 0, errors.join(" | "));
  await ctx.close();

  // ---------- Reduced motion ----------
  const rm = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  const rp = await rm.newPage();
  await rp.goto(`${BASE}/app`);
  await rp.getByRole("list", { name: "Watch favorites" }).waitFor();
  const motion = await rp.evaluate(() => {
    const card = document.querySelector(".brand-tile");
    const fade = document.querySelector(".fade-in");
    return getComputedStyle(card).transitionDuration.split(",").every((d) => parseFloat(d) === 0) && getComputedStyle(fade).animationName === "none";
  });
  check("reduced motion disables transitions and animations", motion);
  await rm.close();

  // ---------- Mobile dashboard + dock overflow ----------
  const md = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const mdp = await md.newPage();
  await mdp.goto(`${BASE}/app`);
  await mdp.getByRole("button", { name: "No thanks" }).click().catch(() => {});
  await mdp.getByRole("list", { name: "Watch favorites" }).waitFor();
  check("mobile dashboard no horizontal scroll", await noHorizontalScroll(mdp));
  check("mobile header fits the screen", await mdp.evaluate(() => document.querySelector("header").scrollWidth <= window.innerWidth));
  check("mobile shows brand logos", (await mdp.getByRole("list", { name: "Watch favorites" }).locator("[data-icon-kind=brand]").count()) === 8);
  await mdp.screenshot({ path: `${SHOTS}/app-home-390x844.png` });
  await mdp.screenshot({ path: `${SHOTS}/app-home-390x844-full.png`, fullPage: true });
  await mdp.getByRole("button", { name: "More" }).click();
  await mdp.getByRole("link", { name: "Discover" }).click();
  await mdp.waitForURL("**/app/discover");
  check("mobile More menu reaches Discover", mdp.url().endsWith("/app/discover"));
  await md.close();

  // ---------- Mobile onboarding ----------
  const { devices } = require("playwright");
  const m = await browser.newContext({ ...devices["iPhone 13"] });
  const mp = await m.newPage();
  await mp.goto(`${BASE}/`);
  await mp.getByRole("button", { name: "No thanks" }).click();
  for (const [p, file] of [["/", "mobile-landing"], ["/start", "mobile-start"], ["/login", "mobile-login"], ["/pair?code=ABCD-EFGH", "mobile-pair"]]) {
    await mp.goto(`${BASE}${p}`);
    await mp.locator("h1").first().waitFor();
    await mp.waitForTimeout(300);
    check(`mobile ${p} no horizontal scroll`, await noHorizontalScroll(mp));
    await mp.screenshot({ path: `${SHOTS}/${file}.png` });
  }
  await m.close();

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

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
  for (const [w, h] of [[1280, 800], [1920, 1080]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);
    await page.getByRole("button", { name: "No thanks" }).click();
    await page.getByRole("region", { name: "Interactive dashboard preview" }).getByRole("list", { name: "Watch favorites" }).waitFor();
    check(`landing headline @${w}x${h}`, await visible(page.getByRole("heading", { name: "Your Tesla downtime, upgraded." })));
    check(`landing no horizontal scroll @${w}x${h}`, await noHorizontalScroll(page));
    await page.screenshot({ path: `${SHOTS}/landing-${w}x${h}.png` });

    await page.goto(`${BASE}/app`);
    await page.getByRole("list", { name: "Watch favorites" }).waitFor();
    check(`dashboard no horizontal scroll @${w}x${h}`, await noHorizontalScroll(page));
    await page.getByRole("button", { name: "No thanks" }).click().catch(() => {});
    await page.screenshot({ path: `${SHOTS}/app-home-${w}x${h}.png` });
    for (const v of ["library", "focus", "settings"]) {
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

  await page.goto(`${BASE}/app`);
  await page.getByRole("list", { name: "Watch favorites" }).waitFor();
  const favList = page.getByRole("list", { name: "Watch favorites" });
  check("8 default Watch favorites", (await favList.locator("li").count()) === 8);
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

  // Library search + favorite toggle
  await page.goto(`${BASE}/app/library`);
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
  await page.getByRole("tab", { name: "Cloud games" }).click();
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
  await page.getByRole("radio", { name: "Split (prototype)" }).click();
  check("split layout renders two panes", (await page.getByRole("region", { name: /pane/ }).count()) === 2);

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

  check("no uncaught page errors", errors.length === 0, errors.join(" | "));
  await ctx.close();

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

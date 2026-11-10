import { describe, expect, it } from "vitest";
import { CATALOG, CATALOG_BY_ID, CATEGORY_LABELS } from "@/lib/catalog";
import { DEFAULT_PRESET_FAVORITES, PRESETS } from "@/lib/presets";
import { DEFAULT_WIDGET_LAYOUTS } from "@/lib/widgets";
import { sanitizePreferences } from "@/lib/prefs";
import { BRAND_TILES } from "@/lib/brand-icons";
import { BRAND_ICON_DATA } from "@/lib/brand-icon-data";

describe("Games category and preset", () => {
  it("labels the games category 'Games' and holds the cloud gaming services", () => {
    expect(CATEGORY_LABELS.games).toBe("Games");
    const games = CATALOG.filter((c) => c.category === "games").map((c) => c.id);
    expect(games).toEqual(["gta-vi-xbox", "xbox-cloud", "geforce-now"]);
  });

  it("adds a Games mode with the three games tiles, and Watch no longer includes Xbox", () => {
    expect(PRESETS.map((p) => p.id)).toContain("games");
    expect(PRESETS.find((p) => p.id === "games")!.parkedUse).toBe(true);
    expect(DEFAULT_PRESET_FAVORITES.games).toEqual(["gta-vi-xbox", "xbox-cloud", "geforce-now"]);
    expect(DEFAULT_PRESET_FAVORITES.watch).not.toContain("xbox-cloud");
    expect(DEFAULT_WIDGET_LAYOUTS.games.order.length).toBeGreaterThan(0);
  });

  it("keeps saved data when Games is added (v2 data without a games list gets the default)", () => {
    const saved = { version: 2, activePreset: "watch", presets: { watch: ["netflix", "xbox-cloud"] } };
    const p = sanitizePreferences(saved);
    expect(p.presets.watch).toEqual(["netflix", "xbox-cloud"]);
    expect(p.presets.games).toEqual(DEFAULT_PRESET_FAVORITES.games);
    expect(sanitizePreferences({ activePreset: "games" }).activePreset).toBe("games");
  });
});

describe("GTA VI on Xbox Cloud Gaming tile", () => {
  const gta = CATALOG_BY_ID.get("gta-vi-xbox")!;

  it("links to the official Xbox Cloud Gaming page as a same-tab top-level navigation", () => {
    expect(gta.url).toBe("https://www.xbox.com/play");
    expect(gta.launch).toBe("same-tab");
    expect(gta.category).toBe("games");
    expect(gta.parkedUseOnly).toBe(true);
  });

  it("shows the launch note, keeps the untested label and has a setup guide", () => {
    expect(gta.note).toBe("Launches Nov 19, 2026. Requires Xbox Game Pass and a controller.");
    expect(gta.teslaStatus).toBe("not-tested");
    expect(gta.guide).toBe("gta-xbox");
  });

  it("uses a CruiseCtrl text tile, never third-party logos or artwork", () => {
    expect(gta.textTile).toEqual({ title: "GTA VI", caption: "Cloud gaming" });
    expect(BRAND_TILES["gta-vi-xbox"]).toBeUndefined();
    expect(BRAND_ICON_DATA["gta-vi-xbox"]).toBeUndefined();
  });
});

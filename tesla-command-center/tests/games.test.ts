import { describe, expect, it } from "vitest";
import { CATALOG, CATALOG_BY_ID, CATEGORY_LABELS, GTA_VI_XBOX_ID, TESLA_STATUS_LABEL } from "@/lib/catalog";
import { BRAND_ICON_DATA } from "@/lib/brand-icon-data";
import { BRAND_TILES } from "@/lib/brand-icons";
import { DEFAULT_PRESET_FAVORITES } from "@/lib/presets";
import { sanitizePreferences } from "@/lib/prefs";
import { CLOUD_GAMING_STEPS } from "@/components/GameGuide";

describe("Games category", () => {
  it("is labelled Games and holds the cloud gaming services", () => {
    expect(CATEGORY_LABELS.games).toBe("Games");
    const games = CATALOG.filter((s) => s.category === "games").map((s) => s.id);
    expect(games).toEqual([GTA_VI_XBOX_ID, "xbox-cloud", "geforce-now"]);
  });

  it("game services are parked use and link to the official https sites", () => {
    for (const s of CATALOG.filter((x) => x.category === "games")) {
      expect(s.parkedUseOnly, s.id).toBe(true);
      expect(new URL(s.url).protocol, s.id).toBe("https:");
      expect(s.teslaStatus, s.id).toBe("not-tested");
    }
  });

  it("Xbox Cloud Gaming is no longer a Watch default", () => {
    expect(DEFAULT_PRESET_FAVORITES.watch).not.toContain("xbox-cloud");
    expect(DEFAULT_PRESET_FAVORITES.watch.every((id) => CATALOG_BY_ID.has(id))).toBe(true);
  });
});

describe("GTA VI on Xbox Cloud Gaming tile", () => {
  const gta = CATALOG_BY_ID.get(GTA_VI_XBOX_ID)!;

  it("opens xbox.com/play as a same-tab top-level link", () => {
    expect(gta.url).toBe("https://www.xbox.com/play");
    expect(gta.launch).toBe("same-tab");
    expect(gta.featured).toBe(true);
  });

  it("has the agreed subtitle and keeps the not-tested label", () => {
    expect(gta.name).toBe("GTA VI on Xbox Cloud Gaming");
    expect(gta.blurb).toBe("Launches Nov 19, 2026. Requires Xbox Game Pass and a controller.");
    expect(TESLA_STATUS_LABEL[gta.teslaStatus]).toBe("Not yet tested on Tesla");
  });

  it("uses our own text tile, never a bundled third-party logo", () => {
    expect(gta.textTile).toEqual({ label: "GTA VI", icon: "gamepad" });
    expect(BRAND_ICON_DATA[GTA_VI_XBOX_ID]).toBeUndefined();
    expect(BRAND_TILES[GTA_VI_XBOX_ID]).toBeUndefined();
  });

  it("has a how-to-play guide covering the setup steps", () => {
    expect(gta.guide).toBe("cloud-gaming");
    const text = CLOUD_GAMING_STEPS.map((s) => `${s.title} ${s.body}`).join(" ");
    for (const needle of ["Park", "controller", "DualSense", "Xbox wireless", "Wi-Fi", "hotspot", "Game Pass", "5, 10 or 15 hours"]) {
      expect(text).toContain(needle);
    }
  });

  it("can be favorited and survives preference sanitizing", () => {
    const p = sanitizePreferences({ presets: { watch: [GTA_VI_XBOX_ID] }, launchOverrides: { [GTA_VI_XBOX_ID]: "new-tab" } });
    expect(p.presets.watch).toEqual([GTA_VI_XBOX_ID]);
    expect(p.launchOverrides[GTA_VI_XBOX_ID]).toBe("new-tab");
  });
});

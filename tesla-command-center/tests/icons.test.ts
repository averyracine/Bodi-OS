import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { CATALOG } from "@/lib/catalog";
import { BRAND_TILES } from "@/lib/brand-icons";
import { BRAND_ICON_DATA } from "@/lib/brand-icon-data";

const NO_LOGO = new Set([
  "plugshare", // no freely published SVG; uses the monogram fallback
  "gta-vi-xbox", // deliberately our own text/icon tile: no Rockstar or Xbox logos or art
]);
const UNSAFE = /<script|<foreignObject|\bon[a-z]+\s*=|<image|<style|href\s*=\s*"(?!#)|url\((?!#)|@import/i;

describe("brand icons", () => {
  it("every catalog app has a bundled logo and tile style, except documented gaps", () => {
    for (const app of CATALOG) {
      if (NO_LOGO.has(app.id)) {
        expect(BRAND_ICON_DATA[app.id], app.id).toBeUndefined();
        continue;
      }
      expect(BRAND_ICON_DATA[app.id], `logo for ${app.id}`).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(BRAND_TILES[app.id], `tile for ${app.id}`).toBeDefined();
    }
  });

  it("has no logos or tile styles for apps that aren't in the catalog", () => {
    const ids = new Set(CATALOG.map((c) => c.id));
    for (const k of Object.keys(BRAND_ICON_DATA)) expect(ids.has(k), k).toBe(true);
    for (const k of Object.keys(BRAND_TILES)) expect(ids.has(k), k).toBe(true);
  });

  it("bundled SVGs are self-contained and safe", () => {
    for (const [id, uri] of Object.entries(BRAND_ICON_DATA)) {
      const svg = Buffer.from(uri.split(",")[1], "base64").toString("utf8");
      expect(svg.startsWith("<svg"), id).toBe(true);
      expect(svg, id).toMatch(/viewBox=/);
      expect(UNSAFE.test(svg), `${id} unsafe`).toBe(false);
    }
  });

  it("generated data matches the source files (run `npm run icons` after editing assets)", () => {
    const dir = path.resolve(import.meta.dirname, "../assets/brand-icons");
    const files = readdirSync(dir).filter((f) => f.endsWith(".svg"));
    expect(files.length).toBe(Object.keys(BRAND_ICON_DATA).length);
    for (const f of files) {
      const svg = readFileSync(path.join(dir, f), "utf8").trim();
      expect(BRAND_ICON_DATA[f.replace(".svg", "")]).toBe(`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`);
    }
  });
});

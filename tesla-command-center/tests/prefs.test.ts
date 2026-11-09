import { describe, expect, it } from "vitest";
import { defaultPreferences, moveItem, moveItemTo, sanitizePreferences } from "@/lib/prefs";

describe("sanitizePreferences", () => {
  it("returns defaults for garbage", () => {
    expect(sanitizePreferences("nope")).toEqual(defaultPreferences());
    expect(sanitizePreferences(null)).toEqual(defaultPreferences());
  });

  it("drops dangerous custom links and unknown fields", () => {
    const p = sanitizePreferences({
      theme: "midnight",
      evil: true,
      customLinks: [
        { id: "custom-aaaa", name: "Bad", url: "javascript:alert(1)" },
        { id: "custom-bbbb", name: "Good", url: "https://example.com" },
        { id: "not-custom", name: "Spoof", url: "https://example.com" },
      ],
      launchOverrides: { youtube: "same-tab", "custom-aaaa": "same-tab", netflix: "popup" },
    });
    expect(p.theme).toBe("midnight");
    expect(p.customLinks).toEqual([{ id: "custom-bbbb", name: "Good", url: "https://example.com/" }]);
    expect(p.launchOverrides).toEqual({ youtube: "same-tab" });
    expect("evil" in p).toBe(false);
  });

  it("caps favorites at 8 and dedupes", () => {
    const p = sanitizePreferences({ presets: { watch: ["a", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] } });
    expect(p.presets.watch).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
  });
});

describe("move helpers", () => {
  it("moves by one and ignores out-of-range", () => {
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
    expect(moveItemTo(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });
});

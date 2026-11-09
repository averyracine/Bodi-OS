import { describe, expect, it } from "vitest";
import { safeNextPath, validateCustomUrl } from "@/lib/url";

describe("validateCustomUrl", () => {
  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "http://example.com",
    "ftp://example.com",
    "https://user:pass@example.com",
    "https://localhost/",
    "https://127.0.0.1/",
    "https://10.0.0.5/",
    "https://192.168.1.1/",
    "https://169.254.169.254/latest/meta-data",
    "https://[::1]/",
    "https://intranet/",
    "https://example.com:8443/",
    "https://exa mple.com",
    "",
    "example.com",
  ])("rejects %s", (u) => {
    expect(validateCustomUrl(u).ok).toBe(false);
  });

  it("accepts and normalizes public https links", () => {
    const r = validateCustomUrl("  https://Example.com/path?q=1  ");
    expect(r).toEqual({ ok: true, url: "https://example.com/path?q=1" });
  });
});

describe("safeNextPath", () => {
  it("blocks open redirects", () => {
    expect(safeNextPath("https://evil.com")).toBe("/app");
    expect(safeNextPath("//evil.com")).toBe("/app");
    expect(safeNextPath("/\\evil.com")).toBe("/app");
    expect(safeNextPath("/pair?code=ABCD-EFGH")).toBe("/pair?code=ABCD-EFGH");
  });
});

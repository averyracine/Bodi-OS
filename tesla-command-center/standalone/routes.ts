/** Maps the app's real paths to plain #names for the single-page demo build. */
export const HASH_FOR_PATH: [prefix: string, hash: string][] = [
  ["/app/library", "library"],
  ["/app/focus", "focus"],
  ["/app/settings", "preferences"],
  ["/app", "dashboard"],
  ["/start", "get-started"],
  ["/login", "preferences"],
  ["/pair", "preferences"],
];

export function toHash(href: string): string {
  if (!href.startsWith("/")) return href;
  const path = href.split(/[?#]/)[0];
  if (path === "/") return "#";
  const hit = HASH_FOR_PATH.find(([p]) => path === p || path.startsWith(p + "/"));
  return hit ? `#${hit[1]}` : "#";
}

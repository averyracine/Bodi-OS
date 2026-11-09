/**
 * Curated starter catalog.
 *
 * Every entry is a plain link to the service's official web destination.
 * None of these are embedded, proxied, or verified to work in a Tesla browser.
 * Names are trademarks of their respective owners; we render our own
 * monogram tiles instead of third-party logos so a tile is never mistaken for
 * an endorsement or a compatibility claim.
 */

export type Category = "video" | "music" | "games" | "productivity" | "custom";
export type LaunchBehavior = "new-tab" | "same-tab";
export type TeslaStatus = "not-tested";

export interface CatalogService {
  id: string;
  name: string;
  category: Exclude<Category, "custom">;
  url: string;
  /** Default way we open the link. Always a top-level navigation. */
  launch: LaunchBehavior;
  /** Whether the service is known to need its own account/subscription. */
  requiresAccount: boolean;
  teslaStatus: TeslaStatus;
  /** Entertainment and interactive services are flagged for parked use. */
  parkedUseOnly: boolean;
  hue: number;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  video: "Video",
  music: "Music & audio",
  games: "Cloud games",
  productivity: "Productivity",
  custom: "My links",
};

export const TESLA_STATUS_LABEL: Record<TeslaStatus, string> = {
  "not-tested": "Not yet tested on Tesla",
};

const s = (
  id: string,
  name: string,
  category: CatalogService["category"],
  url: string,
  hue: number,
  opts: Partial<Pick<CatalogService, "requiresAccount" | "parkedUseOnly" | "launch">> = {},
): CatalogService => ({
  id,
  name,
  category,
  url,
  hue,
  launch: opts.launch ?? "new-tab",
  requiresAccount: opts.requiresAccount ?? true,
  teslaStatus: "not-tested",
  parkedUseOnly: opts.parkedUseOnly ?? category !== "productivity",
});

export const CATALOG: CatalogService[] = [
  s("youtube", "YouTube", "video", "https://www.youtube.com/", 4, { requiresAccount: false }),
  s("netflix", "Netflix", "video", "https://www.netflix.com/", 358),
  s("disney-plus", "Disney+", "video", "https://www.disneyplus.com/", 220),
  s("prime-video", "Prime Video", "video", "https://www.primevideo.com/", 200),
  s("espn", "ESPN", "video", "https://www.espn.com/watch/", 0),
  s("hbo-max", "HBO Max", "video", "https://www.hbomax.com/", 230),
  s("paramount-plus", "Paramount+", "video", "https://www.paramountplus.com/", 220),
  s("apple-tv", "Apple TV", "video", "https://tv.apple.com/", 0),
  s("twitch", "Twitch", "video", "https://www.twitch.tv/", 265, { requiresAccount: false }),
  s("plex", "Plex", "video", "https://app.plex.tv/", 42),
  s("spotify", "Spotify", "music", "https://open.spotify.com/", 140),
  s("apple-music", "Apple Music", "music", "https://music.apple.com/", 350),
  s("youtube-music", "YouTube Music", "music", "https://music.youtube.com/", 0),
  s("xbox-cloud", "Xbox Cloud Gaming", "games", "https://www.xbox.com/play", 120),
  s("geforce-now", "GeForce NOW", "games", "https://play.geforcenow.com/", 90),
  s("google-calendar", "Google Calendar", "productivity", "https://calendar.google.com/", 215),
  s("google-docs", "Google Docs", "productivity", "https://docs.google.com/", 210),
  s("notion", "Notion", "productivity", "https://www.notion.so/", 0),
];

export const CATALOG_BY_ID: ReadonlyMap<string, CatalogService> = new Map(
  CATALOG.map((svc) => [svc.id, svc]),
);

export function monogram(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

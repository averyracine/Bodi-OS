/**
 * Curated starter catalog.
 *
 * Every entry is a plain link to the service's official web destination.
 * None of these are embedded, proxied, or verified to work in a Tesla browser.
 * Names are trademarks of their respective owners. By default we render our own
 * icon treatment (monogram on a tint of the service's accent colour) rather than
 * third-party logos; see brand-icons.ts for the opt-in logo set.
 */

export type Category = "video" | "music" | "ai" | "productivity" | "games" | "utilities" | "custom";
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
  /** Accent colour used sparingly on the icon tint. */
  accent: string;
  /** Kept for custom-link compatibility; derived from accent for catalog items. */
  hue: number;
  blurb: string;
  /** Highlighted at the top of its category on Home and in the Library. */
  featured?: boolean;
  /**
   * Our own text/icon tile instead of a logo. Used where we deliberately show
   * no third-party logos, cover art or screenshots.
   */
  textTile?: { label: string; icon: "gamepad" };
  /** Opens a "How to play" setup sheet from an info button on the tile. */
  guide?: "cloud-gaming";
}

/** Internal keys stay stable ("video", "games") so saved data and URLs keep working. */
export const CATEGORY_LABELS: Record<Category, string> = {
  video: "Streaming",
  music: "Music",
  ai: "AI",
  productivity: "Productivity",
  games: "Games",
  utilities: "Utilities",
  custom: "My links",
};

export const TESLA_STATUS_LABEL: Record<TeslaStatus, string> = {
  "not-tested": "Not yet tested on Tesla",
};

function hueOf(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 210;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

const s = (
  id: string,
  name: string,
  category: CatalogService["category"],
  url: string,
  accent: string,
  blurb: string,
  opts: Partial<Pick<CatalogService, "requiresAccount" | "parkedUseOnly" | "launch" | "featured" | "textTile" | "guide">> = {},
): CatalogService => ({
  id,
  name,
  category,
  url,
  accent,
  hue: hueOf(accent),
  blurb,
  launch: opts.launch ?? "new-tab",
  requiresAccount: opts.requiresAccount ?? true,
  teslaStatus: "not-tested",
  parkedUseOnly: opts.parkedUseOnly ?? (category === "video" || category === "games"),
  ...(opts.featured ? { featured: true } : {}),
  ...(opts.textTile ? { textTile: opts.textTile } : {}),
  ...(opts.guide ? { guide: opts.guide } : {}),
});

/** The featured GTA VI launch tile. It is only a link to Xbox Cloud Gaming's own site. */
export const GTA_VI_XBOX_ID = "gta-vi-xbox";

export const CATALOG: CatalogService[] = [
  // Streaming
  s("youtube", "YouTube", "video", "https://www.youtube.com/", "#FF3B30", "Videos, creators and live streams.", { requiresAccount: false }),
  s("netflix", "Netflix", "video", "https://www.netflix.com/", "#E50914", "Series and films."),
  s("espn", "ESPN", "video", "https://www.espn.com/watch/", "#E8322B", "Live sports and highlights."),
  s("prime-video", "Prime Video", "video", "https://www.primevideo.com/", "#1FA8E0", "Amazon's film and TV service."),
  s("disney-plus", "Disney+", "video", "https://www.disneyplus.com/", "#3D6BF5", "Disney, Pixar, Marvel and Star Wars."),
  s("hbo-max", "HBO Max", "video", "https://www.hbomax.com/", "#5A3CF0", "HBO series and films."),
  s("paramount-plus", "Paramount+", "video", "https://www.paramountplus.com/", "#2F7BFF", "Paramount films, TV and sports."),
  s("apple-tv", "Apple TV", "video", "https://tv.apple.com/", "#A0A7B4", "Apple TV+ originals and store."),
  s("twitch", "Twitch", "video", "https://www.twitch.tv/", "#9146FF", "Live streams and gaming.", { requiresAccount: false }),
  s("plex", "Plex", "video", "https://app.plex.tv/", "#EBAF00", "Your own media library."),
  // Music
  s("spotify", "Spotify", "music", "https://open.spotify.com/", "#1ED760", "Music and podcasts."),
  s("apple-music", "Apple Music", "music", "https://music.apple.com/", "#FA3B57", "Music and radio."),
  s("youtube-music", "YouTube Music", "music", "https://music.youtube.com/", "#FF4A4A", "Music, mixes and videos."),
  // AI
  s("chatgpt", "ChatGPT", "ai", "https://chatgpt.com/", "#10A37F", "OpenAI's assistant."),
  s("claude", "Claude", "ai", "https://claude.ai/", "#D97757", "Anthropic's assistant."),
  s("gemini", "Gemini", "ai", "https://gemini.google.com/", "#6E8BFF", "Google's assistant."),
  s("perplexity", "Perplexity", "ai", "https://www.perplexity.ai/", "#20B8CD", "Answer engine with sources."),
  // Productivity
  s("gmail", "Gmail", "productivity", "https://mail.google.com/", "#EA4335", "Email."),
  s("google-calendar", "Google Calendar", "productivity", "https://calendar.google.com/", "#4285F4", "Your schedule."),
  s("google-drive", "Google Drive", "productivity", "https://drive.google.com/", "#1FA463", "Files and folders."),
  s("google-docs", "Google Docs", "productivity", "https://docs.google.com/", "#4C8BF5", "Documents."),
  s("notion", "Notion", "productivity", "https://www.notion.so/", "#C8CDD5", "Notes, docs and wikis."),
  // Games. Links out to each service's official site; we never stream games ourselves.
  // Same-tab, top-level navigation: Xbox is expected to refuse embedding.
  s(GTA_VI_XBOX_ID, "GTA VI on Xbox Cloud Gaming", "games", "https://www.xbox.com/play", "#7C5CFF",
    "Launches Nov 19, 2026. Requires Xbox Game Pass and a controller.",
    { launch: "same-tab", featured: true, textTile: { label: "GTA VI", icon: "gamepad" }, guide: "cloud-gaming" }),
  s("xbox-cloud", "Xbox Cloud Gaming", "games", "https://www.xbox.com/play", "#107C10", "Stream Xbox games."),
  s("geforce-now", "GeForce NOW", "games", "https://play.geforcenow.com/", "#76B900", "Stream PC games."),
  // Utilities (trip prep and charging stops; plan before you drive)
  s("google-maps", "Google Maps", "utilities", "https://www.google.com/maps", "#34A853", "Maps and directions.", { requiresAccount: false }),
  s("waze", "Waze", "utilities", "https://www.waze.com/live-map", "#33CCFF", "Live map and traffic.", { requiresAccount: false }),
  s("plugshare", "PlugShare", "utilities", "https://www.plugshare.com/", "#F26B21", "EV charger map and reviews.", { requiresAccount: false }),
  s("supercharger-map", "Supercharger map", "utilities", "https://www.tesla.com/findus", "#E8EBEF", "Tesla's public charger locator.", { requiresAccount: false }),
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

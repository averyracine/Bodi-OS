/**
 * How each service's logo sits on its branded tile. Logo files live in
 * assets/brand-icons/ and are bundled by scripts/gen-brand-icons.mjs (see
 * SOURCES.md for provenance). Logos remain trademarks of their owners.
 *
 * `h` is the logo's height as a share of a 4:3 tile; the image keeps its own
 * proportions (object-fit: contain) and is also capped at `maxW` of the tile
 * width, so wide wordmarks fill across while compact symbols fill upward.
 */

export interface BrandTile {
  /** Background across the whole tile (CSS colour or gradient). */
  bg: string;
  /** Logo height as a fraction of tile height. */
  h: number;
  /** Logo max width as a fraction of tile width (default 0.78). */
  maxW?: number;
  /** Light tiles get a hairline border so they don't glow on the dark UI. */
  light?: boolean;
}

const W = "#FFFFFF";

export const BRAND_TILES: Record<string, BrandTile> = {
  // Streaming
  youtube: { bg: W, h: 0.5, light: true },
  netflix: { bg: "#000000", h: 0.62 },
  espn: { bg: "#000000", h: 0.6, maxW: 0.8 },
  "prime-video": { bg: "#0779FF", h: 0.8, maxW: 0.8 },
  "disney-plus": { bg: "linear-gradient(160deg,#0E1F5B,#0A0F2E)", h: 0.82, maxW: 0.82 },
  "hbo-max": { bg: "linear-gradient(160deg,#1C2BD9,#0A0F5C)", h: 0.9, maxW: 0.74 },
  "paramount-plus": { bg: "#0064FF", h: 0.6 },
  "apple-tv": { bg: "#000000", h: 0.64, maxW: 0.6 },
  twitch: { bg: "#9146FF", h: 0.52 },
  plex: { bg: "#1F1F1F", h: 0.9, maxW: 0.66 },
  // Music
  spotify: { bg: "#000000", h: 0.54 },
  "apple-music": { bg: "linear-gradient(160deg,#FB5C74,#FA233B)", h: 0.5 },
  "youtube-music": { bg: W, h: 0.56, light: true },
  // AI
  chatgpt: { bg: W, h: 0.52, light: true },
  claude: { bg: "#F5F2EA", h: 0.52, light: true },
  gemini: { bg: W, h: 0.54, light: true },
  perplexity: { bg: "#091717", h: 0.54 },
  // Productivity
  gmail: { bg: W, h: 0.42, light: true },
  "google-calendar": { bg: W, h: 0.54, light: true },
  "google-drive": { bg: W, h: 0.48, light: true },
  "google-docs": { bg: W, h: 0.56, light: true },
  notion: { bg: W, h: 0.52, light: true },
  // Gaming
  "xbox-cloud": { bg: "#107C10", h: 0.56 },
  "geforce-now": { bg: "#000000", h: 0.56 },
  // Utilities
  "google-maps": { bg: W, h: 0.56, light: true },
  waze: { bg: "#33CCFF", h: 0.56 },
  "supercharger-map": { bg: "#000000", h: 0.5 },
};

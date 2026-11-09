/**
 * How each service's logo sits on its tile: background colour and how much of
 * the tile the logo fills. Logo files live in assets/brand-icons/ and are
 * bundled by scripts/gen-brand-icons.mjs (see SOURCES.md for provenance).
 * Logos remain trademarks of their owners.
 */

export interface BrandTile {
  /** Tile background behind the logo (CSS colour or gradient). */
  bg: string;
  /** Fraction of the tile the logo occupies (0-1). */
  scale: number;
  /** Light tiles get a hairline border so they don't glow on the dark UI. */
  light?: boolean;
}

const W = "#FFFFFF";

export const BRAND_TILES: Record<string, BrandTile> = {
  // Streaming
  youtube: { bg: W, scale: 0.62, light: true },
  netflix: { bg: "#000000", scale: 0.6 },
  espn: { bg: W, scale: 0.84, light: true },
  "prime-video": { bg: "#1A98FF", scale: 1 },
  "disney-plus": { bg: W, scale: 0.84, light: true },
  "hbo-max": { bg: "linear-gradient(160deg,#1C2BD9,#0A0F5C)", scale: 0.78 },
  "paramount-plus": { bg: "#0064FF", scale: 0.66 },
  "apple-tv": { bg: "#000000", scale: 0.6 },
  twitch: { bg: W, scale: 0.6, light: true },
  plex: { bg: "#1F1F1F", scale: 0.6 },
  // Music
  spotify: { bg: "#000000", scale: 0.64 },
  "apple-music": { bg: "linear-gradient(160deg,#FB5C74,#FA233B)", scale: 0.56 },
  "youtube-music": { bg: W, scale: 0.68, light: true },
  // AI
  chatgpt: { bg: W, scale: 0.62, light: true },
  claude: { bg: "#FAF9F5", scale: 0.6, light: true },
  gemini: { bg: W, scale: 0.62, light: true },
  perplexity: { bg: "#091717", scale: 0.58 },
  // Productivity
  gmail: { bg: W, scale: 0.6, light: true },
  "google-calendar": { bg: W, scale: 0.62, light: true },
  "google-drive": { bg: W, scale: 0.62, light: true },
  "google-docs": { bg: W, scale: 0.58, light: true },
  notion: { bg: W, scale: 0.6, light: true },
  // Gaming
  "xbox-cloud": { bg: W, scale: 0.64, light: true },
  "geforce-now": { bg: "#000000", scale: 0.64 },
  // Utilities
  "google-maps": { bg: W, scale: 0.6, light: true },
  waze: { bg: "#33CCFF", scale: 0.62 },
  "supercharger-map": { bg: "#000000", scale: 0.54 },
};

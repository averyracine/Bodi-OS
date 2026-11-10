/**
 * Dashboard presets. These are interface layouts, not vehicle operating modes.
 *
 * Ids are stable storage keys. "focus" is shown as "Work" since V2; existing
 * saved Focus favorites carry over unchanged.
 */
export type PresetId = "watch" | "listen" | "focus" | "drive";

export interface PresetMeta {
  id: PresetId;
  label: string;
  blurb: string;
  parkedUse: boolean;
}

export const PRESETS: PresetMeta[] = [
  { id: "watch", label: "Watch", blurb: "Streaming and sports for a charging stop.", parkedUse: true },
  { id: "listen", label: "Listen", blurb: "Music and audio up front.", parkedUse: false },
  { id: "focus", label: "Work", blurb: "AI assistants, mail, calendar and notes.", parkedUse: true },
  { id: "drive", label: "Drive", blurb: "Trip prep: maps, chargers, weather and your day. Set it up before you go.", parkedUse: true },
];

export const PRESET_IDS: PresetId[] = PRESETS.map((p) => p.id);

export const DEFAULT_PRESET_FAVORITES: Record<PresetId, string[]> = {
  watch: ["youtube", "netflix", "espn", "prime-video", "disney-plus", "hbo-max", "paramount-plus", "twitch"],
  listen: ["spotify", "apple-music", "youtube-music", "youtube", "plex", "twitch"],
  focus: ["chatgpt", "claude", "gemini", "gmail", "google-calendar", "google-drive", "notion", "perplexity"],
  drive: ["google-maps", "waze", "plugshare", "supercharger-map", "google-calendar", "spotify"],
};

export const MAX_FAVORITES = 8;

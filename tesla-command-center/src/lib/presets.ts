export type PresetId = "watch" | "listen" | "focus";

export interface PresetMeta {
  id: PresetId;
  label: string;
  blurb: string;
  parkedUse: boolean;
}

export const PRESETS: PresetMeta[] = [
  { id: "watch", label: "Watch", blurb: "Video services for a charging stop.", parkedUse: true },
  { id: "listen", label: "Listen", blurb: "Music and audio, front and centre.", parkedUse: false },
  { id: "focus", label: "Focus", blurb: "Notes, timer and work tools.", parkedUse: true },
];

export const DEFAULT_PRESET_FAVORITES: Record<PresetId, string[]> = {
  watch: ["youtube", "netflix", "disney-plus", "prime-video", "twitch", "plex"],
  listen: ["spotify", "apple-music", "youtube-music", "youtube", "plex", "twitch"],
  focus: ["google-calendar", "google-docs", "notion", "spotify", "youtube-music", "youtube"],
};

export const MAX_FAVORITES = 8;

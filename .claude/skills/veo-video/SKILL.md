---
name: veo-video
description: Generate short marketing videos with Google's Veo models for Bodi-OS video ads, social clips (Reels/Stories/TikTok/YouTube Shorts), and website background videos. Use whenever the task involves creating, generating, or animating a video/clip/motion asset — including text-to-video and image-to-video (animating a still photo or a Nano Banana image creative). Produces native synchronized audio. Defaults to the highest-quality model (Veo 3.1).
---

# Veo video generation

Generate short video clips with Google's Veo models for video ads and social
content. This skill wraps a Node CLI (`generate-video.mjs`) that calls the
Gemini API, polls the async job, and downloads an MP4. Pairs naturally with the
`nano-banana` skill: generate a still, then animate it with `--image`.

## Models

| Alias  | Model ID                        | Use for                                        |
|--------|---------------------------------|------------------------------------------------|
| `pro`  | `veo-3.1-generate-preview`      | **Default.** Best quality + native audio.      |
| `fast` | `veo-3.1-fast-generate-preview` | Faster / cheaper drafts and variations.        |
| `lite` | `veo-3.1-lite-generate-preview` | High-efficiency, high-volume ideation.         |

## Setup (one time)

1. Install the dependency (from this skill's directory):
   ```bash
   cd .claude/skills/veo-video && npm install
   ```
2. Provide a Gemini API key — export `GEMINI_API_KEY`, or create a git-ignored
   `.env` here (`GEMINI_API_KEY=...`). The script also falls back to the sibling
   `nano-banana/.env`, so one key can serve both skills. Key from
   https://aistudio.google.com/apikey. **Never commit the key.**

## Usage

```bash
node generate-video.mjs --prompt "PROMPT" --out clip.mp4 [--model pro] [--aspect 16:9] [--resolution 720p] [--image still.png] [--negative "..."]
```

Options:
- `--prompt` (required) — what happens in the video (motion, camera, mood, audio).
- `--out` — output MP4 path (default `veo-output.mp4`).
- `--model` — `pro` (default) | `fast` | `lite`.
- `--aspect` — `16:9` (YouTube/web) or `9:16` (Reels/Stories/TikTok).
- `--resolution` — `720p` (default) or `1080p` (16:9 only).
- `--image` — a still to animate (image-to-video); use a Nano Banana creative here.
- `--negative` — things to avoid.

### Examples

Text-to-video social ad (vertical):
```bash
node generate-video.mjs \
  --prompt "Energetic 8-second clip: person finishing a workout in a bright gym, smiling, upbeat music, motivational tone. Camera slowly pushes in." \
  --aspect 9:16 --out reel-ad.mp4
```

Animate a still creative (image-to-video):
```bash
node generate-video.mjs \
  --prompt "Gentle steam rising from the food, soft light shift, subtle slow zoom" \
  --image ../nano-banana/ig-meal-ad.png --aspect 1:1 --out meal-ad-motion.mp4
```

## Guidance

- **Aspect by placement:** `9:16` for Reels/Stories/TikTok/Shorts, `16:9` for
  YouTube and website heroes.
- **Describe motion and audio:** Veo 3.1 generates synchronized audio — mention
  music mood, ambient sound, or dialogue if wanted.
- **Image-to-video** gives the most brand control: lock the look with a Nano
  Banana still, then animate it.
- Clips are short (seconds). Generation is asynchronous and can take a few
  minutes; the script polls until the MP4 is ready.
- **Cost:** video generation is significantly more expensive than images — use
  `fast`/`lite` for drafts and `pro` for finals. Every clip carries an invisible
  SynthID watermark.

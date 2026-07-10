---
name: nano-banana
description: Generate and edit marketing images with Google's Nano Banana (Gemini image models) for Bodi-OS ad creatives and website imagery. Use whenever the task involves creating, generating, editing, restyling, or composing an image/photo/graphic for an ad, ad creative, landing page, website hero, social post, banner, thumbnail, or any visual asset — including meal/food photos, fitness/transformation visuals, product mockups, and images with text baked in. Defaults to the highest-quality model (Nano Banana Pro).
---

# Nano Banana image generation

Generate ad and website images with Google's Gemini image models ("Nano Banana").
This skill wraps a small Node CLI (`generate.mjs`) that calls the Gemini API and
saves PNGs. It is meant to be used directly by the agent to produce marketing
visuals for Bodi-OS.

## Models

| Alias    | Model ID                  | Use for                                                    |
|----------|---------------------------|-----------------------------------------------------------|
| `pro`    | `gemini-3-pro-image`      | **Default.** Best quality, accurate in-image text, up to 4K. Use for finished ad creatives and hero images. |
| `flash2` | `gemini-3.1-flash-image`  | Fast, high-volume ideation / variations.                  |
| `flash`  | `gemini-2.5-flash-image`  | Original Nano Banana; cheapest.                            |

## Setup (one time)

1. Install the dependency (from this skill's directory):
   ```bash
   cd .claude/skills/nano-banana && npm install
   ```
2. Provide a Gemini API key. Either export it, or create a git-ignored `.env`
   in this directory:
   ```
   GEMINI_API_KEY=your_key_here
   ```
   Get a key at https://aistudio.google.com/apikey. **Never commit the key** —
   `.env` is git-ignored.

## Usage

Run from the skill directory (or point node at the full path):

```bash
node generate.mjs --prompt "PROMPT" --out OUTPUT.png [--model pro] [--aspect 1:1] [--size 2K] [--edit INPUT.png]
```

Options:
- `--prompt` (required) — what to generate, or how to edit the `--edit` inputs.
- `--out` — output PNG path (default `nano-banana-output.png`).
- `--model` — `pro` (default) | `flash2` | `flash`.
- `--aspect` — `1:1`, `4:5`, `9:16`, `16:9`, `3:2`, `3:4`, etc. Pick per placement.
- `--size` — `1K` | `2K` | `4K` (Nano Banana Pro only; default `2K`).
- `--edit` — an input image to edit or compose. Repeat for up to 14 images
  (e.g. blend a product photo into a scene, or restyle an existing creative).

### Examples

Generate a square Instagram ad creative:
```bash
node generate.mjs \
  --prompt "Vibrant flat-lay of a healthy high-protein meal prep bowl, soft daylight, top-down, modern minimalist styling, space at top for headline text" \
  --aspect 1:1 --out ig-meal-ad.png
```

Website hero, wide, high-res:
```bash
node generate.mjs \
  --prompt "Athletic person mid-workout in a bright modern gym, motivational and energetic, clean negative space on the left for a headline" \
  --aspect 16:9 --size 4K --out web-hero.png
```

Edit / restyle an existing creative:
```bash
node generate.mjs \
  --prompt "Add the headline 'Fuel Your Transformation' in bold clean sans-serif at the top, keep everything else the same" \
  --edit ig-meal-ad.png --out ig-meal-ad-headline.png
```

## Guidance for good ad/website creatives

- **Aspect ratio by placement:** `1:1` or `4:5` for feed ads, `9:16` for
  Stories/Reels, `16:9` for website heroes and YouTube, `1:1` for logos/icons.
- **Leave room for copy:** ask for "negative space" or "empty area" where a
  headline/CTA will be overlaid, rather than baking in text you'll replace.
- **Text in images:** Nano Banana Pro renders text well — spell out the exact
  words in quotes when you want them in the image.
- **Brand/product consistency:** pass reference images with `--edit` to keep a
  product, model, or style consistent across a campaign.
- Every image includes Google's invisible SynthID watermark.

## Notes

- Output is always PNG. If the model returns multiple images, extra files are
  saved as `name-1.png`, `name-2.png`, ...
- Requires network access to the Gemini API and a valid API key.

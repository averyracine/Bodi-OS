# Brand icon sources

These logos identify the third-party service a tile links to. They remain trademarks of their owners and don't imply endorsement or Tesla compatibility. Review each owner's brand guidelines before a paid public launch. Set `NEXT_PUBLIC_SERVICE_LOGOS=off` to fall back to the app's own monogram icons.

`scripts/gen-brand-icons.mjs` bundles these files as `data:` URIs, so nothing is fetched at runtime. Every file is checked: no scripts, styles, embedded images or external references.

| File | Source | Notes |
| --- | --- | --- |
| youtube, netflix, twitch, plex, spotify, apple-music, youtube-music, geforce-now (NVIDIA mark), notion, hbo-max, paramount-plus, apple-tv, claude, perplexity, waze, supercharger-map (Tesla mark) | [Simple Icons](https://simpleicons.org) 16.37.0, CC0-1.0 SVG data | Single-colour paths; colour set to the brand colour (Twitch white, for its purple tile) |
| gemini | Simple Icons `googlegemini` path | Gradient fill approximates Google's Gemini spark colours |
| chatgpt | Wikimedia Commons, `OpenAI_logo_2025_(symbol).svg` | |
| espn | Wikimedia Commons, `ESPN_wordmark.svg` | |
| prime-video | Wikimedia Commons, `Amazon_Prime_Video_logo_(2024).svg` | |
| disney-plus | Wikimedia Commons, `Disney+_logo.svg` | Wordmark recoloured white for the dark tile (Disney+ uses a white mark on navy) |
| xbox-cloud | Wikimedia Commons, `Xbox_one_logo.svg` | viewBox added; recoloured white for use on Xbox green |
| gmail, google-maps, google-calendar, google-drive, google-docs | Wikimedia Commons 2020 icon files | Google Docs: inline styles converted to fill attributes |

Not available as a freely published SVG: **PlugShare**. Its tile uses the monogram fallback.

Commons files were fetched from `upload.wikimedia.org` on 2026-11-09. Check each file page's licence and trademark notice before commercial use.

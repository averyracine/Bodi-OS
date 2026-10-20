# FunSculpting Provider Ad: Creative Rationale

**Audience:** physicians and medical-practice owners (B2B), mainly on Meta placements (Reels/Stories 9:16, Feed 4:5) plus 16:9 for YouTube and the landing page.
**Job of the ad:** get a qualified provider to book a practice growth call, the `demo_booked` conversion on `/funsculpting/`.

## Structure (flagship)
| # | Beat | Speaker / take | On-screen | Why it's here |
|---|---|---|---|---|
| 1 | Hook: the problem | Dr. Dean, 1729 (punch-in) | NEW CASH-PAY SERVICE LINE? | Opens on the provider's pain (new revenue without added complexity), delivered by a physician to physicians. The question overlay makes the hook work with the sound off. |
| 2 | What it is | Mike, 1744 | BUILT FOR MEDICAL PRACTICES | Names the category in one line. See the regulatory note on "regenerative medicine". |
| 3 | Credibility | Dr. Dean, 1733 → 1735 (punch) → 1737 | none | Dean frames the decision the way a physician evaluates one (clinical use, training, workflow, business model). It reads as advice, not a pitch, and earns trust before the offer. Alternating punch-ins hide the jump cuts. |
| 4 | Differentiator | Mike, 1745 trimmed to "business in a box … front end to back end … marketing" | TECHNOLOGY + TRAINING + SUPPORT | The one concrete differentiator, a full system rather than just a device. 1730 device B-roll covers the internal cut. |
| 5 | Offer | Avery, 1746 → 1747 program (punch) → 1747 structured launch | 90-DAY MARKETING SUPPORT | Moves from "is it worth it?" to "what you get" to "where it ends up" (a structured launch). |
| 6 | CTA | Avery, 1749 (brochure cover B-roll) → 1751 (punch) | End card: BOOK A PRIVATE PROVIDER WALKTHROUGH | Spells out who it's for, then the explicit ask. The end card matches the landing-page CTA. |

**Short cut (~30 s, 9:16):** hook → 1747 program → 1751 CTA → end card. 1746 is left out to stay under 30 s; add `avery_opp` back to the `short` sequence in `edl.json` for the ~39 s version.

## Craft decisions
- **Color:** iPhone HLG/Dolby Vision is tone-mapped to SDR BT.709 (zscale + Hable), then a light contrast and saturation lift. Without this, Meta's player shows it washed out and yellow.
- **Captions:** burned in, 4 words max per line, in the lower third clear of the Reels UI. Value words (FunSculpting, cash-pay, business in a box, 90 days, structured launch, practice growth call) are in brand gold. About 85% of feed video plays muted.
- **Overlays:** navy panel with a gold rule, matching the brochure cover. One idea per overlay, and never over a speaker's face.
- **Reframing:** 4:5 is a high crop of the 9:16 frame (keeps faces and caption space). 16:9 puts the vertical frame over a blurred fill of itself instead of stretching or over-cropping.
- **Audio:** 80 Hz high-pass, FFT denoise, gentle compression, 10 ms declick fades at every cut, two-pass loudnorm to -14 LUFS / -1.5 dBTP. No music unless a licensed track is supplied.
- **Imagery:** brochure *cover* only (IMG_1752, 0–2 s). The inside spreads contain before/after body photos and are excluded.

## Known gaps
- Runtime: with every take in the plan, the flagship runs about 85 s once 1745 is trimmed (about 108 s if 1745 can't be trimmed). The ~60 s target needs cuts. In order: drop 1744 (−11.5 s, also removes the regulatory phrase), drop 1737 (−7 s), and drop 1746 (−9 s). That gives about 57 s.
- Whether the standing speaker in 1733–1738 is Dr. Dean is still unconfirmed. No name supers are burned in for that reason.
- No Mike-clip machine B-roll in-points were logged yet. Add `broll` entries in `edl.json` once picked from the contact sheets.

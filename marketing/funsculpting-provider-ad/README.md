# FunSculpting Provider Ad: Render Pipeline

Builds the FunSculpting provider video ad from the October iPhone shoot (the `new ad october` folder: IMG_1725–1752 MOVs, `_work/`, `tx_vad.json`). The footage isn't in this repo. Run the pipeline on the machine that has it. Original MOVs are only read, never modified.

| File | Purpose |
|---|---|
| `edl.json` | The edit: takes, cut points, punch-ins, overlays, B-roll, end card, both cuts. **Change the ad here.** |
| `build_ad.py` | Runs every production step: SDR intermediates, assembly, loudness, graphics, captions, 4 MP4s, SRT, EDL |
| `CREATIVE_RATIONALE.md` | Beat-by-beat reasoning and craft decisions |
| `CLAIMS_VERIFICATION.md` | Pre-launch claim and policy sign-off list |
| `make_test_footage.py` | Synthetic iPhone-format clips (HLG, rotated HEVC, 60 fps) for testing without the real footage |

## Run
```bash
# requirements: ffmpeg with libzimg + libass + libx264 (Homebrew's `ffmpeg` has all three), Python 3.8+, Pillow
pip install pillow
pip install faster-whisper            # optional but recommended: word-level cuts + captions

cd "new ad october"
python3 /path/to/build_ad.py --dry-run     # resolved edit + runtimes, renders nothing
python3 /path/to/build_ad.py               # everything → ./FunSculpting_Ad_Final/
```
Useful flags: `--cuts short`, `--formats 9x16`, `--font ~/Library/Fonts/Montserrat-ExtraBold.ttf`, `--words off`, `--force` (rebuild cached intermediates in `_work/build/`).

## Output (`FunSculpting_Ad_Final/`)
- `FunSculpting_Provider_Flagship_9x16.mp4`, `_4x5.mp4`, `_16x9.mp4`, `FunSculpting_Provider_Short_9x16.mp4`. All H.264 High CRF 18, 30 fps, BT.709, AAC 192k, +faststart, −14 LUFS.
- `.srt` and CMX3600 `.edl` per cut, plus the two notes files.

## Cut points
1. If `tx_vad.json` has word timings, those are used. Otherwise local whisper (`faster-whisper`, then `openai-whisper`) runs once per clip, cached in `_work/build/IMG_xxxx.words.json`. Cuts snap to the first and last word ±0.1 s.
2. With no word timings, the VAD boundaries in `edl.json` are used with 0.1 s padding. **Mike's 1745 trim needs words.** Without them, the whole 3.96–25.34 take (`mike_full`) is used instead.

If a `start_text`/`end_text` anchor isn't found, the build stops and names the segment. Fix the phrase to match what whisper heard.

## Tested
Run end to end on `make_test_footage.py` clips (HEVC 10-bit HLG/BT.2020, 1920x1080 with −90° rotation, 60 fps). Output: 4 MP4s at the correct sizes, audio and video durations equal, −14.0 LUFS integrated, captions, overlays, blurred-fill B-roll and end card all checked by frame grabs. Word-anchored resolution tested with a synthetic `tx_vad.json`. **Not yet run on the real footage or real whisper output.** Check the dry-run table, and scrub the 1730/1752 cutaways and the end-card background on first render.

## Open decisions (see rationale and claims notes)
- Flagship runtime is ~92 s with words (≈108 s without) vs the ~60 s target. Suggested cuts: drop `mike_what` (1744, also the regulatory phrase), `dean_conv`, `avery_opp` → ≈57 s.
- Confirm the standing speaker in 1733–1738 is Dr. Dean.
- Confirm the hands-on training and 90-day marketing support claims against the contract.
